import torch
from transformers import AutoTokenizer, AutoModelForQuestionAnswering, pipeline
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ClinicalChatbot:
    def __init__(self, model_name="emilyalsentzer/Bio_ClinicalBERT"):
        logger.info(f"Loading Clinical BERT model: {model_name}")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForQuestionAnswering.from_pretrained(model_name)
            self.qa_pipeline = pipeline("question-answering", model=self.model, tokenizer=self.tokenizer)
            self.ready = True
        except Exception as e:
            logger.error(f"Failed to load BERT model: {e}")
            self.ready = False

    def generate_context(self, server_state):
        """
        Converts the current federated learning 'gradients' and state into 
        a clinical context string for BERT.
        """
        round_num = server_state.get("current_round", 0)
        accuracy = server_state.get("accuracy", 0.0)
        nodes = server_state.get("nodes", [])
        
        context = f"The Global Medical Intelligence Swarm (GMIS) is currently at training round {round_num}. "
        context += f"The global model has reached a validation accuracy of {accuracy:.2f}%. "
        
        if nodes:
            drift_summaries = []
            for node in nodes:
                drift = node.get("drift_score", 0)
                status = "stable" if drift < 0.1 else "diverging"
                drift_summaries.append(f"{node['name']} shows a {status} gradient update (drift: {drift:.3f})")
            context += "Recent node analysis: " + "; ".join(drift_summaries) + "."
        
        context += " The model is primarily trained on clinical notes and diagnostic data to identify pneumonia and related respiratory conditions."
        return context

    def ask(self, question, server_state):
        if not self.ready:
            return "I'm still initializing my clinical knowledge base. Please wait a moment."
        
        context = self.generate_context(server_state)
        
        try:
            result = self.qa_pipeline(question=question, context=context)
            # Since BERT QA gives short answers, we wrap it in a more conversational tone
            answer = result['answer']
            score = result['score']
            
            if score < 0.01:
                return "Based on the current model gradients and training state, I don't have enough specific information to answer that. However, the system remains stable."
            
            return f"According to the latest clinical swarm data, {answer}."
        except Exception as e:
            logger.error(f"Error during inference: {e}")
            return "I encountered an error while processing the clinical context. The swarm gradients are still being analyzed."

# Singleton instance for the API
_chatbot_instance = None

def get_chatbot():
    global _chatbot_instance
    if _chatbot_instance is None:
        _chatbot_instance = ClinicalChatbot()
    return _chatbot_instance

if __name__ == "__main__":
    # Test suite
    mock_state = {
        "current_round": 15,
        "accuracy": 88.5,
        "nodes": [
            {"name": "Hospital Chennai", "drift_score": 0.051},
            {"name": "Hospital Nairobi", "drift_score": 0.142}
        ]
    }
    bot = ClinicalChatbot()
    print(bot.ask("What is the accuracy of the global model?", mock_state))
    print(bot.ask("Which hospital is diverging?", mock_state))
