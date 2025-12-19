# ADIA-X Sarcasm Detector - Extension Chrome

Extension Chrome intelligente qui détecte le sarcasme dans les tweets X (Twitter) en temps réel en utilisant un modèle de Machine Learning ONNX.

## 🎯 Description du Projet

Cette extension Chrome utilise un modèle de Machine Learning basé sur ONNX Runtime pour analyser automatiquement les tweets et détecter le sarcasme. L'extension s'intègre directement dans l'interface de X (Twitter) et affiche des badges visuels indiquant si un tweet est sarcastique ou non, avec un score de confiance.

**Technologies utilisées :**
- 🧠 ONNX Runtime Web pour l'inférence du modèle
- 🎨 JavaScript/CSS pour l'intégration UI
- 🔧 Chrome Extension Manifest V3
- 📊 Modèle ML entraîné pour la détection de sarcasme

## ✨ Fonctionnalités

- 🔍 Détection automatique du sarcasme dans les tweets sur X.com et Twitter.com
- 🎨 Indicateurs visuels avec badges de couleur (orange pour sarcasme, vert pour non-sarcasme)
- 📊 Affichage des scores de confiance du modèle
- 🔄 Détection en temps réel sur les tweets chargés dynamiquement
- ⚡ Traitement rapide grâce à ONNX Runtime Web
- 🎯 Intégration transparente dans l'interface X/Twitter

## 📦 Installation

### Prérequis

⚠️ **IMPORTANT** : Le fichier `model.onnx` n'est pas inclus dans ce dépôt en raison de sa taille. Vous devez ajouter votre propre modèle ONNX.

**Étapes d'installation :**

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/sabri-abdelaaziz/sarcasm_detection_chrome_extension.git
   cd sarcasm_detection_chrome_extension
   ```

2. **⚠️ Ajouter le modèle ONNX (REQUIS)**
   - Placez votre fichier `model.onnx` dans le dossier racine de l'extension
   - Le fichier doit être nommé exactement `model.onnx`
   - Assurez-vous que le modèle est compatible avec ONNX Runtime Web
   - Le modèle doit accepter du texte tokenisé en entrée et retourner une prédiction de sarcasme

3. **Vérifier le fichier de vocabulaire**
   - Le fichier `vocab.txt` doit être présent (déjà inclus dans le dépôt)
   - Ce fichier contient le vocabulaire pour la tokenisation du texte

4. **Charger l'extension dans Chrome**
   - Ouvrez Chrome et naviguez vers `chrome://extensions/`
   - Activez le "Mode développeur" (toggle en haut à droite)
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier de l'extension

5. **Tester l'extension**
   - Naviguez vers https://x.com ou https://twitter.com
   - L'extension détectera automatiquement les tweets et affichera des indicateurs de sarcasme
   - Cliquez sur l'icône de l'extension pour voir les statistiques

## 🏗️ Architecture du Projet

### Structure des Fichiers

```
sarcasm_detection_chrome_extension/
├── manifest.json          # Configuration de l'extension Chrome (Manifest V3)
├── content.js             # Script principal qui détecte et analyse les tweets
├── model.js               # Logique du modèle ONNX et inférence
├── model.onnx            # ⚠️ Modèle ML (NON INCLUS - À AJOUTER)
├── vocab.txt              # Vocabulaire pour la tokenisation
├── vocab-loader.js        # Chargeur du vocabulaire
├── ort.min.js            # ONNX Runtime Web library
├── ort-wasm*.wasm        # WASM binaries pour ONNX Runtime
├── styles.css             # Styles pour les badges de sarcasme
├── popup.html             # Interface popup de l'extension
├── popup.js               # Logique du popup
├── images/
│   └── icon.png          # Icône de l'extension
├── flask_api/            # API Flask alternative (optionnelle)
│   ├── app.py
│   ├── requirements.txt
│   └── README.md
└── README.md              # Ce fichier
```

## 🔧 Comment ça Marche

### 1. Chargement du Modèle
- L'extension charge le modèle ONNX au démarrage
- ONNX Runtime Web est utilisé pour l'inférence dans le navigateur
- Le vocabulaire est chargé depuis `vocab.txt`

### 2. Détection des Tweets
- **Content Script** (`content.js`) s'exécute sur les pages X.com/Twitter.com
- Utilise `MutationObserver` pour surveiller les nouveaux tweets
- Extrait le texte des tweets et les envoie au modèle

### 3. Analyse du Sarcasme
- Le texte est tokenisé selon le vocabulaire
- Le modèle ONNX fait la prédiction
- Retourne un score de confiance (0-100%)

### 4. Affichage des Résultats
- 🟠 **Badge orange** : Sarcasme détecté (≥50% confiance)
- 🟢 **Badge vert** : Pas de sarcasme (<50% confiance)
- Affiche le pourcentage de confiance

## 📋 Exigences du Modèle ONNX

Pour que l'extension fonctionne correctement, votre fichier `model.onnx` doit :

1. **Format d'entrée** :
   - Accepter des tensors d'entiers (IDs de tokens)
   - Dimensions : `[batch_size, sequence_length]`
   - Généralement : `[1, max_seq_length]` pour un tweet

2. **Format de sortie** :
   - Retourner un tensor de probabilités
   - Shape : `[batch_size, num_classes]` ou `[batch_size, 1]`
   - Valeurs entre 0 et 1 (probabilité de sarcasme)

3. **Compatibilité** :
   - Compatible avec ONNX Runtime Web
   - Opérateurs supportés par la version WASM
   - Taille raisonnable pour le chargement dans le navigateur

## 🚀 Utilisation Alternative : API Flask

Si vous préférez utiliser une API backend au lieu du modèle dans le navigateur :

1. Naviguez vers le dossier `flask_api/`
2. Consultez le README dans ce dossier pour les instructions d'installation
3. Lancez l'API Flask
4. Modifiez `content.js` pour pointer vers votre endpoint API

## 🧪 Développement et Tests

## 🧪 Développement et Tests

### Prérequis de Développement
- Google Chrome ou Chromium
- Fichier `model.onnx` (votre modèle ML entraîné)
- Connaissance de base en JavaScript et ML

### Tests
1. Chargez l'extension en mode développeur
2. Ouvrez la console Chrome (F12) pour voir les logs
3. Naviguez vers X.com
4. Vérifiez que les badges apparaissent sur les tweets

### Debugging
- Ouvrez la console pour voir les logs de l'extension
- Vérifiez que `model.onnx` est bien chargé
- Consultez les erreurs ONNX Runtime si le modèle ne charge pas

## 🔧 Dépannage

| Problème | Solution |
|----------|----------|
| **Le modèle ne charge pas** | Vérifiez que `model.onnx` est présent et compatible avec ONNX Runtime Web |
| **Badges non visibles** | Ouvrez la console (F12) pour voir les erreurs, vérifiez que vous êtes sur x.com ou twitter.com |
| **Erreur WASM** | Assurez-vous que les fichiers `.wasm` sont présents dans le dossier |
| **Vocabulaire non trouvé** | Vérifiez la présence de `vocab.txt` |
| **Prédictions incorrectes** | Le modèle nécessite peut-être un réentraînement ou un ajustement |

## 📝 Notes Importantes

- ⚠️ Le fichier `model.onnx` doit être ajouté manuellement (non inclus dans le dépôt Git)
- 📦 Les fichiers WASM pour ONNX Runtime sont inclus et nécessaires
- 🔒 L'extension nécessite les permissions pour x.com et twitter.com
- 🚀 Le modèle s'exécute entièrement côté client (pas de serveur requis)

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📄 Licence

MIT License - Libre d'utilisation et de modification.

## 👨‍💻 Auteur

Développé par Sabri Abdelaaziz

---

**Note** : N'oubliez pas d'ajouter votre fichier `model.onnx` avant de charger l'extension !
