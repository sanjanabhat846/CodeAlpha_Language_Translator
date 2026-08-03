"""
Backend Utility Module.
Contains JSON request validation and helper functions.
"""

def extract_translation_payload(request_json: dict) -> tuple[str, str, str]:
    """
    Extracts and sanitizes 'text', 'source', and 'target' fields from request JSON.
    
    :param request_json: Parsed JSON payload
    :return: Tuple of (text, source, target)
    """
    if not request_json or not isinstance(request_json, dict):
        return "", "auto", ""

    text = request_json.get("text", "")
    source = request_json.get("source", "auto")
    target = request_json.get("target", "")

    return (
        str(text) if text is not None else "",
        str(source) if source is not None else "auto",
        str(target) if target is not None else ""
    )
