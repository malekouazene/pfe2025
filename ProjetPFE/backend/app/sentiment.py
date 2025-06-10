from transformers import pipeline

# Charger le pipeline de sentiment
sentiment_pipeline = pipeline("sentiment-analysis", model="nlptown/bert-base-multilingual-uncased-sentiment")

def analyze_sentiment(text: str) -> dict:
    print("→ Analyse en cours…") 
    result = sentiment_pipeline(text[:512])[0]  # max 512 tokens
    label = result['label']
    
    # Exemple de transformation
    if "1" in label or "2" in label:
        sentiment = "négatif"
    elif "3" in label:
        sentiment = "neutre"
    else:
        sentiment = "positif"
    
    return {
        "sentiment": sentiment,  
        "raw_label": label,
        "score": result['score']
    }
