"""SafeSpace multimodal stress-assessment pipeline.

Modules
-------
config         Shared constants: class labels, artifact paths, signal settings.
physiological  CSV validation, 10 s windowing and 180-feature extraction (ECG/EDA/EMG/Temp).
questionnaire  Validation of the seven DASS-21 stress-item answers.
voice          Audio decoding, MFCC extraction and the voice model's custom Attention layer.
fusion         Confidence-weighted late fusion of the three per-model probability vectors.
explanations   SHAP, attention and fusion-weight explanations for the API response.
artifacts      Loading of the saved model files from ``Server/models``.
"""
