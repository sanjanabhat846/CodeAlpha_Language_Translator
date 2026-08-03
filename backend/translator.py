"""
Deep-Translator GoogleTranslator API Wrapper Module.
Provides low-level interaction with deep_translator library.
"""

import logging
from deep_translator import GoogleTranslator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GoogleTranslatorWrapper:
    """
    Wrapper class for deep-translator GoogleTranslator engine.
    Encapsulates translation operations and language validation.
    """

    def __init__(self):
        self._supported_languages = None

    def get_supported_languages_dict(self) -> dict:
        """
        Retrieves supported languages dictionary mapping language names to language codes.
        Example: {'english': 'en', 'french': 'fr', ...}
        """
        if not self._supported_languages:
            try:
                # Retrieve dictionary of supported languages
                self._supported_languages = GoogleTranslator().get_supported_languages(as_dict=True)
            except Exception as e:
                logger.error(f"Failed to fetch supported languages from deep-translator: {e}")
                self._supported_languages = {}
        return self._supported_languages

    def is_valid_language(self, lang: str) -> bool:
        """
        Validates if a given language code or language name is supported by GoogleTranslator.
        'auto' is considered valid for source language.
        """
        if not lang or not isinstance(lang, str):
            return False
        
        lang_clean = lang.strip().lower()
        if lang_clean == "auto":
            return True

        supported_dict = self.get_supported_languages_dict()
        
        # Check if lang is a valid language name (value) or language code (key/value)
        codes = set(supported_dict.values())
        names = set(supported_dict.keys())

        return lang_clean in codes or lang_clean in names

    def translate(self, text: str, target: str, source: str = "auto") -> str:
        """
        Translates text from source language to target language using GoogleTranslator.
        
        :param text: Text string to translate
        :param target: Target language code or name (e.g., 'fr', 'french')
        :param source: Source language code or name (default: 'auto')
        :return: Translated text string
        :raises Exception: On translation failure
        """
        try:
            logger.info(f"Translating text (source='{source}', target='{target}')")
            translator = GoogleTranslator(source=source.lower(), target=target.lower())
            translated_result = translator.translate(text)
            return translated_result
        except Exception as e:
            logger.error(f"GoogleTranslator error during translation: {e}")
            raise RuntimeError(f"Translation service failure: {str(e)}")
