"""
Translation Service Module.
Handles business logic, validation enforcement, and translation workflows.
"""

from backend.translator import GoogleTranslatorWrapper


class TranslationService:
    """
    Business service layer managing translation operations and validation.
    """

    def __init__(self):
        self.translator_wrapper = GoogleTranslatorWrapper()

    def validate_languages(self, source: str, target: str) -> tuple[bool, str]:
        """
        Validates source and target language parameters.
        
        :return: Tuple of (is_valid: bool, error_message: str)
        """
        if not target or not isinstance(target, str) or not target.strip():
            return False, "Target language parameter 'target' is required and cannot be empty."

        if source and not self.translator_wrapper.is_valid_language(source):
            return False, f"Invalid source language '{source}'."

        if not self.translator_wrapper.is_valid_language(target):
            return False, f"Invalid target language '{target}'."

        return True, ""

    def process_translation(self, text: str, target: str, source: str = "auto") -> tuple[dict, int]:
        """
        Executes the translation request workflow with comprehensive error handling.
        
        :param text: Raw text to translate
        :param target: Target language code or name
        :param source: Source language code or name (defaults to 'auto')
        :return: Tuple of (response_dict, http_status_code)
        """
        # 1. Input Validation: Text parameter
        if not text or not isinstance(text, str) or not text.strip():
            return {"error": "Text parameter 'text' is required and cannot be empty."}, 400

        # 2. Language Validation
        is_valid_lang, lang_error = self.validate_languages(source=source, target=target)
        if not is_valid_lang:
            return {"error": lang_error}, 400

        # 3. Perform Translation
        try:
            translated_text = self.translator_wrapper.translate(
                text=text.strip(),
                target=target.strip(),
                source=source.strip() if source else "auto"
            )
            return {"translated_text": translated_text}, 200
        except Exception as e:
            return {"error": f"Translation failed: {str(e)}"}, 500

    def get_supported_languages(self) -> tuple[dict, int]:
        """
        Retrieves supported languages for the frontend or clients.
        """
        try:
            languages = self.translator_wrapper.get_supported_languages_dict()
            return {"languages": languages}, 200
        except Exception as e:
            return {"error": f"Failed to retrieve languages: {str(e)}"}, 500
