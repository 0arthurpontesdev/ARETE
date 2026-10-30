import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class MeetingAICopilotService:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.model_name = model_name
        self.client = None

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Google Gemini Client initialized successfully.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini Client: {e}. Falling back to internal engine.")
                self.client = None

    def is_gemini_available(self) -> bool:
        return self.client is not None

    def _prepare_context(self, meeting_data: Dict[str, Any]) -> str:
        topic = meeting_data.get("topic", "Reunião de Alinhamento")
        date_str = meeting_data.get("date", datetime.now().strftime("%d/%m/%Y %H:%M"))
        duration = meeting_data.get("duration", "Em andamento")
        participants = meeting_data.get("participants", [])
        transcripts = meeting_data.get("transcripts", [])
        chat_messages = meeting_data.get("chat_messages", [])

        participant_names = []
        for p in participants:
            if isinstance(p, dict):
                role = " (Anfitrião)" if p.get("isHost") else ""
                participant_names.append(f"{p.get('name', 'Participante')}{role}")
            elif isinstance(p, str):
                participant_names.append(p)

        context_lines = [
            f"=== METADADOS DA REUNIÃO ===",
            f"Tópico: {topic}",
            f"Data/Hora: {date_str}",
            f"Duração: {duration}",
            f"Participantes Conectados: {', '.join(participant_names) if participant_names else 'Nenhum'}",
            "",
            f"=== TRANSCRIÇÕES DE FALA ==="
        ]

        if transcripts:
            for t in transcripts:
                speaker = t.get("speaker", "Participante")
                text = t.get("text", "")
                ts = t.get("timestamp", "")
                context_lines.append(f"[{ts}] {speaker}: {text}")
        else:
            context_lines.append("(Nenhuma transcrição de voz gravada até o momento)")

        context_lines.append("")
        context_lines.append("=== MENSAGENS DO CHAT ===")
        if chat_messages:
            for m in chat_messages:
                sender = m.get("senderName", "Participante")
                text = m.get("text", "")
                ts = m.get("timestamp", "")
                context_lines.append(f"[{ts}] {sender}: {text}")
        else:
            context_lines.append("(Nenhuma mensagem no chat)")

        return "\n".join(context_lines)

    # =========================================================================
    # 1. RESUMO EXECUTIVO (SUMMARY)
    # =========================================================================
    def generate_summary(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        context = self._prepare_context(meeting_data)
        topic = meeting_data.get("topic", "Reunião de Alinhamento")

        if self.client:
            try:
                prompt = (
                    "Você é o Copilot de IA de Reuniões corporativas de alto nível. "
                    "Analise o contexto da reunião abaixo e retorne ESTRITAMENTE um objeto JSON válido (sem tags markdown adicionais) "
                    "com as seguintes chaves:\n"
                    "- topic (string): título/tema da reunião\n"
                    "- executive_summary (string): resumo executivo conciso em 2 a 3 parágrafos em português formal\n"
                    "- key_points (lista de strings): principais tópicos e discussões levantadas\n"
                    "- main_decisions (lista de strings): decisões tomadas pelos participantes\n"
                    "- sentiment (string): tom geral da reunião (ex: 'Muito Produtivo', 'Alinhamento Estratégico', 'Colaborativo')\n"
                    "- engagement_level (string): nível de engajamento (ex: 'Alto', 'Moderado')\n\n"
                    f"Contexto:\n{context}"
                )

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                text = response.text.strip()
                # Clean json fences if present
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                data = json.loads(text.strip())
                data["source"] = "gemini"
                data["generated_at"] = datetime.now().isoformat()
                return data
            except Exception as e:
                logger.error(f"Error generating summary with Gemini: {e}. Using heuristic fallback.")

        return self._heuristic_summary(meeting_data)

    def _heuristic_summary(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        topic = meeting_data.get("topic", "Reunião de Alinhamento Semanal")
        participants = meeting_data.get("participants", [])
        transcripts = meeting_data.get("transcripts", [])
        chat = meeting_data.get("chat_messages", [])

        names = [p.get("name", "Participante") if isinstance(p, dict) else str(p) for p in participants]
        names_str = ", ".join(names) if names else "os participantes presentes"

        # Heuristic key points from transcripts or default topics
        key_points = []
        decisions = []

        all_texts = [t.get("text", "") for t in transcripts] + [m.get("text", "") for m in chat]

        for text in all_texts:
            lower = text.lower()
            if any(k in lower for k in ["decidido", "ficou acordado", "combinado", "concordo", "aprovado", "definido"]):
                decisions.append(text)
            elif any(k in lower for k in ["projeto", "arquitetura", "entrega", "prazo", "revisão", "teste", "funcionalidade", "copilot", "webrtc"]):
                key_points.append(text)

        if not key_points:
            key_points = [
                f"Alinhamento geral sobre as metas do projeto com {names_str}.",
                "Revisão dos fluxos de trabalho e status operacional das tarefas em andamento.",
                "Validação das diretrizes de entrega e sincronização entre os times."
            ]

        if not decisions:
            decisions = [
                "Aprovada a continuidade do plano de desenvolvimento traçado.",
                "Ficou acordada a validação das próximas entregas na reunião seguinte."
            ]

        summary_text = (
            f"A reunião '{topic}' contou com a presença de {names_str}. "
            f"Durante a sessão, os participantes debateram o andamento das atividades estratégicas, "
            f"identificaram prioridades operacionais e alinharam pontos de contato críticos para as próximas entregas. "
            f"Foram acordadas decisões fundamentais para manter a sincronização da equipe e a qualidade técnica dos entregáveis."
        )

        return {
            "topic": topic,
            "executive_summary": summary_text,
            "key_points": key_points[:5],
            "main_decisions": decisions[:4],
            "sentiment": "Produtivo & Alinhado",
            "engagement_level": "Alto" if len(all_texts) > 5 else "Moderado",
            "source": "heuristic_fallback",
            "generated_at": datetime.now().isoformat()
        }

    # =========================================================================
    # 2. ATA FORMAL DA REUNIÃO (MEETING MINUTES)
    # =========================================================================
    def generate_minutes(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        context = self._prepare_context(meeting_data)
        topic = meeting_data.get("topic", "Reunião de Alinhamento Semanal")

        if self.client:
            try:
                prompt = (
                    "Você é um redator executivo corporativo especializado na confecção de Atas Formais de Reunião no padrão brasileiro. "
                    "Analise o contexto abaixo e retorne ESTRITAMENTE um objeto JSON válido com as seguintes chaves:\n"
                    "- title (string): Título formal da ata\n"
                    "- date (string): Data da reunião por extenso\n"
                    "- start_time (string): Horário de início\n"
                    "- duration (string): Duração estimada\n"
                    "- host (string): Nome do Anfitrião / Presidente da sessão\n"
                    "- attendees (lista de strings): Lista completa dos participantes presentes\n"
                    "- agenda (lista de strings): Itens da pauta discutidos\n"
                    "- discussions (lista de strings): Síntese das discussões ocorridas\n"
                    "- decisions (lista de strings): Deliberações e decisões formais tomadas\n"
                    "- action_items (lista de objetos com: task, assignee, deadline, priority)\n"
                    "- closing_statement (string): Cláusula de encerramento formal\n"
                    "- formatted_document (string): Documento completo formatado em Markdown pronto para cópia ou exportação\n\n"
                    f"Contexto:\n{context}"
                )

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                data = json.loads(text.strip())
                data["source"] = "gemini"
                data["generated_at"] = datetime.now().isoformat()
                return data
            except Exception as e:
                logger.error(f"Error generating minutes with Gemini: {e}. Using heuristic fallback.")

        return self._heuristic_minutes(meeting_data)

    def _heuristic_minutes(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        topic = meeting_data.get("topic", "Reunião de Alinhamento Semanal")
        now = datetime.now()
        date_extenso = now.strftime("%d de %B de %Y")
        start_time = now.strftime("%H:%M")
        duration = meeting_data.get("duration", "45 minutos")

        participants = meeting_data.get("participants", [])
        transcripts = meeting_data.get("transcripts", [])
        chat = meeting_data.get("chat_messages", [])

        attendee_names = []
        host_name = "Anfitrião"
        for p in participants:
            if isinstance(p, dict):
                name = p.get("name", "Participante")
                if p.get("isHost"):
                    host_name = name
                    attendee_names.append(f"{name} (Presidente/Anfitrião)")
                else:
                    attendee_names.append(name)
            else:
                attendee_names.append(str(p))

        if not attendee_names:
            attendee_names = ["Arthur (Presidente/Anfitrião)"]
            host_name = "Arthur"

        agenda = [
            "Abertura e verificação de quórum",
            f"Discussão sobre os objetivos de '{topic}'",
            "Revisão de prioridades técnicas e arquitetura",
            "Deliberações, distribuição de responsabilidades e encerramento"
        ]

        discussions = [
            f"O anfitrião {host_name} abriu a sessão destacando as prioridades da equipe.",
            "Foram levantados os desafios técnicos atuais, incluindo desempenho, sincronização em tempo real e estabilidade do sistema.",
            "Os participantes concordaram com a estruturação dos módulos e manutenção dos padrões de experiência do usuário."
        ]

        decisions = [
            "Aprovação unânime do plano de implementação e das prioridades acordadas.",
            "Fixação de pontos de controle intermediários para checagem de qualidade.",
            "Manutenção da comunicação contínua via canais integrados da plataforma."
        ]

        actions = self._extract_actions_heuristic(meeting_data)

        # Build formatted markdown document
        lines = [
            f"# ATA DE REUNIÃO — {topic.upper()}",
            "",
            f"**Data:** {date_extenso} | **Horário de Início:** {start_time} | **Duração:** {duration}",
            f"**Presidência / Convocação:** {host_name}",
            "",
            "## 1. PRESENTES",
        ]
        for att in attendee_names:
            lines.append(f"- {att}")

        lines.extend([
            "",
            "## 2. ORDEM DO DIA (PAUTA)",
        ])
        for ag in agenda:
            lines.append(f"1. {ag}")

        lines.extend([
            "",
            "## 3. SÍNTESE DAS DISCUSSÕES",
        ])
        for disc in discussions:
            lines.append(f"- {disc}")

        lines.extend([
            "",
            "## 4. DELIBERAÇÕES E DECISÕES TOMADAS",
        ])
        for dec in decisions:
            lines.append(f"- {dec}")

        lines.extend([
            "",
            "## 5. PLANO DE AÇÃO E PRÓXIMOS PASSOS",
            "| Tarefa | Responsável | Prazo | Prioridade |",
            "| :--- | :--- | :--- | :--- |"
        ])
        for act in actions:
            lines.append(f"| {act['task']} | {act['assignee']} | {act['deadline']} | {act['priority']} |")

        closing = (
            f"Nada mais havendo a tratar, o Presidente {host_name} deu por encerrada a sessão, "
            f"da qual eu, como Secretário designado pelo Copilot de IA, lavrei a presente ata que, "
            f"após lida e achada conforme, vai assinada e arquivada para os devidos fins de direito."
        )

        lines.extend([
            "",
            "## 6. ENCERRAMENTO",
            closing,
            "",
            "---",
            f"*Documento gerado automaticamente pelo IA Copilot em {now.strftime('%d/%m/%Y às %H:%M:%S')}.*"
        ])

        formatted_doc = "\n".join(lines)

        return {
            "title": f"Ata da Reunião: {topic}",
            "date": date_extenso,
            "start_time": start_time,
            "duration": duration,
            "host": host_name,
            "attendees": attendee_names,
            "agenda": agenda,
            "discussions": discussions,
            "decisions": decisions,
            "action_items": actions,
            "closing_statement": closing,
            "formatted_document": formatted_doc,
            "source": "heuristic_fallback",
            "generated_at": datetime.now().isoformat()
        }

    # =========================================================================
    # 3. ITENS DE AÇÃO (ACTION ITEMS)
    # =========================================================================
    def generate_action_items(self, meeting_data: Dict[str, Any]) -> Dict[str, Any]:
        context = self._prepare_context(meeting_data)

        if self.client:
            try:
                prompt = (
                    "Você é um assistente de gestão de projetos. Analise a reunião e extraia todos os itens de ação "
                    "(tarefas, responsáveis, prazos e prioridades). Retorne ESTRITAMENTE um JSON com:\n"
                    "- action_items (lista de objetos: id, task, assignee, deadline, priority, status='pending')\n"
                    "- total (número de tarefas)\n\n"
                    f"Contexto:\n{context}"
                )

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                data = json.loads(text.strip())
                data["source"] = "gemini"
                return data
            except Exception as e:
                logger.error(f"Error generating action items with Gemini: {e}. Using fallback.")

        items = self._extract_actions_heuristic(meeting_data)
        return {
            "action_items": items,
            "total": len(items),
            "source": "heuristic_fallback"
        }

    def _extract_actions_heuristic(self, meeting_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        participants = meeting_data.get("participants", [])
        transcripts = meeting_data.get("transcripts", [])
        chat = meeting_data.get("chat_messages", [])

        default_host = "Arthur"
        if participants and isinstance(participants[0], dict):
            default_host = participants[0].get("name", "Arthur")

        action_triggers = [
            ("revisar", "Revisar especificações técnicas e documentação"),
            ("entregar", "Entregar protótipo com os requisitos alinhados"),
            ("testar", "Executar suíte de testes de validação"),
            ("atualizar", "Atualizar backlog e comunicar os stakeholders"),
            ("implementar", "Implementar melhorias acordadas em reunião"),
            ("enviar", "Enviar relatório consolidado aos envolvidos")
        ]

        extracted = []
        counter = 1

        all_turns = []
        for t in transcripts:
            all_turns.append((t.get("speaker", default_host), t.get("text", "")))
        for m in chat:
            all_turns.append((m.get("senderName", default_host), m.get("text", "")))

        for speaker, text in all_turns:
            lower = text.lower()
            for verb, desc in action_triggers:
                if verb in lower:
                    clean_task = text if len(text) < 120 else f"{desc} ({speaker})"
                    extracted.append({
                        "id": f"act-{counter}",
                        "task": clean_task,
                        "assignee": speaker,
                        "deadline": "Próxima sessão",
                        "priority": "Alta" if "urgente" in lower or "hoje" in lower else "Média",
                        "status": "pending"
                    })
                    counter += 1
                    break

        if not extracted:
            extracted = [
                {
                    "id": "act-1",
                    "task": "Finalizar refinamento e validação da ata de reunião",
                    "assignee": default_host,
                    "deadline": "Até o fim do dia",
                    "priority": "Alta",
                    "status": "pending"
                },
                {
                    "id": "act-2",
                    "task": "Realizar testes integrados de áudio e vídeo com a equipe",
                    "assignee": "Equipe de Engenharia",
                    "deadline": "Amanhã às 10:00",
                    "priority": "Média",
                    "status": "pending"
                },
                {
                    "id": "act-3",
                    "task": "Disponibilizar transcrição e gravação para os ausentes",
                    "assignee": default_host,
                    "deadline": "Em até 24h",
                    "priority": "Baixa",
                    "status": "pending"
                }
            ]

        return extracted

    # =========================================================================
    # 4. PERGUNTE À IA (INTERACTIVE Q&A)
    # =========================================================================
    def answer_question(self, meeting_data: Dict[str, Any], question: str) -> Dict[str, Any]:
        if not question or not question.strip():
            return {
                "question": question,
                "answer": "Por favor, formule uma pergunta sobre a reunião.",
                "relevant_citations": [],
                "source": "heuristic_fallback"
            }

        context = self._prepare_context(meeting_data)

        if self.client:
            try:
                prompt = (
                    "Você é o Copilot de IA da Reunião. Responda à pergunta do usuário baseando-se ESTRITAMENTE "
                    "no contexto da reunião (transcrições, chat, participantes e tópicos). "
                    "Se a resposta não estiver no contexto, explique educadamente o que foi discutido e que aquele tópico específico não foi mencionado.\n"
                    "Retorne ESTRITAMENTE um JSON com:\n"
                    "- question (string)\n"
                    "- answer (string em português, clara e prestativa)\n"
                    "- relevant_citations (lista de trechos/falas citadas com nome e horário)\n\n"
                    f"Pergunta: {question}\n\nContexto:\n{context}"
                )

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.endswith("```"):
                    text = text[:-3]
                data = json.loads(text.strip())
                data["source"] = "gemini"
                return data
            except Exception as e:
                logger.error(f"Error in answer_question with Gemini: {e}. Using fallback.")

        return self._heuristic_answer_question(meeting_data, question)

    def _heuristic_answer_question(self, meeting_data: Dict[str, Any], question: str) -> Dict[str, Any]:
        transcripts = meeting_data.get("transcripts", [])
        chat = meeting_data.get("chat_messages", [])
        participants = meeting_data.get("participants", [])
        topic = meeting_data.get("topic", "Reunião de Alinhamento Semanal")

        q_lower = question.lower()
        citations = []

        all_utterances = []
        for t in transcripts:
            all_utterances.append({
                "speaker": t.get("speaker", "Participante"),
                "text": t.get("text", ""),
                "ts": t.get("timestamp", "00:00")
            })
        for m in chat:
            all_utterances.append({
                "speaker": m.get("senderName", "Participante"),
                "text": m.get("text", ""),
                "ts": m.get("timestamp", "00:00")
            })

        # Match tokens
        keywords = [w for w in re.findall(r"\w+", q_lower) if len(w) > 3]
        matches = []
        for u in all_utterances:
            u_text = u["text"].lower()
            score = sum(1 for kw in keywords if kw in u_text)
            if score > 0:
                matches.append((score, u))

        matches.sort(key=lambda x: x[0], reverse=True)

        if "quem" in q_lower or "participante" in q_lower:
            names = [p.get("name", "Participante") if isinstance(p, dict) else str(p) for p in participants]
            answer = f"Os participantes identificados na sessão '{topic}' são: {', '.join(names) if names else 'apenas você no momento'}."
        elif "decis" in q_lower or "acord" in q_lower:
            decisions = self.generate_summary(meeting_data).get("main_decisions", [])
            answer = "As principais decisões registradas foram:\n" + "\n".join(f"• {d}" for d in decisions)
        elif "tarefa" in q_lower or "ação" in q_lower or "prazo" in q_lower:
            actions = self._extract_actions_heuristic(meeting_data)
            answer = "As tarefas e ações pendentes mapeadas são:\n" + "\n".join(f"• [{a['priority']}] {a['task']} (Responsável: {a['assignee']}, Prazo: {a['deadline']})" for a in actions)
        elif matches:
            top_match = matches[0][1]
            citations.append(f"[{top_match['ts']}] {top_match['speaker']}: \"{top_match['text']}\"")
            answer = f"Com base nas intervenções da reunião, {top_match['speaker']} mencionou: \"{top_match['text']}\"."
        else:
            answer = (
                f"A reunião em andamento foca em '{topic}'. "
                f"Até o momento, foram alinhadas as diretrizes operacionais, a lista de tarefas prioritárias "
                f"e os encaminhamentos para as próximas entregas."
            )

        return {
            "question": question,
            "answer": answer,
            "relevant_citations": citations,
            "source": "heuristic_fallback"
        }
