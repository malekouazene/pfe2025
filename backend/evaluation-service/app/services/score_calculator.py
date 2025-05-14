def calculate_score(analysis):
    score = 0
    
    # Score d'âge (jusqu'à 30 points)
    if analysis.get('age') == 2:
        score += 30  # Âge critique
    elif analysis.get('age') == 1:
        score += 15  # Âge d'avertissement
    
    # Obsolescence du firmware (40 points)
    if analysis.get('firmware_obsolete'):
        score += 40
    
    # Problèmes dans les logs (30 points)
    if analysis.get('logs_mention_issue'):
        score += 30
    
    # Analyse RDF (jusqu'à 90 points)
    if analysis.get('rdf_score'):
        score += min(90, analysis['rdf_score'])
    
    # Détection NLP (jusqu'à 50 points)
    if analysis.get('nlp_score'):
        score += analysis['nlp_score']
    
    # Score de classification (jusqu'à 40 points)
    if analysis.get('classification_score'):
        score += analysis['classification_score']
    
    # Normaliser le score entre 0 et 100
    return min(100, score)