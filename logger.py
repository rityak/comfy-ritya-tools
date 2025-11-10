"""
Cross-platform logging utility for comfy-ritya-tools.
Provides colored console output that works on Windows (PowerShell/CMD) and Linux.
"""
import sys
import os


# ANSI color codes (work in modern terminals including Windows PowerShell and Linux)
class Colors:
    """ANSI color codes for terminal output."""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    
    # Text colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    
    # Bright colors
    BRIGHT_BLACK = '\033[90m'
    BRIGHT_RED = '\033[91m'
    BRIGHT_GREEN = '\033[92m'
    BRIGHT_YELLOW = '\033[93m'
    BRIGHT_BLUE = '\033[94m'
    BRIGHT_MAGENTA = '\033[95m'
    BRIGHT_CYAN = '\033[96m'
    BRIGHT_WHITE = '\033[97m'


def is_color_supported():
    """
    Check if the terminal supports ANSI color codes.
    Modern Windows terminals (PowerShell 5.1+, Windows Terminal, CMD with ANSI support) support colors.
    """
    # Check if we're in a terminal
    if not sys.stdout.isatty():
        return False
    
    # On Windows, check for ANSI support
    if os.name == 'nt':
        # Windows 10+ supports ANSI by default in PowerShell and Windows Terminal
        # Check if we're in a modern terminal
        try:
            # Try to enable ANSI support on older Windows versions
            import ctypes
            kernel32 = ctypes.windll.kernel32
            # Enable virtual terminal processing
            kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
            return True
        except:
            # If that fails, assume colors are supported (modern Windows)
            return True
    
    # On Linux/Unix, colors are typically supported
    return True


# Global flag for color support
_COLOR_SUPPORTED = is_color_supported()


def _format_message(level: str, message: str, color: str = Colors.RESET) -> str:
    """
    Format a log message with prefix and optional color.
    
    Args:
        level: Log level (INFO, WARNING, ERROR, SUCCESS)
        message: The message to log
        color: ANSI color code
    
    Returns:
        Formatted message string
    """
    prefix = f"[comfy-ritya-tools]"
    
    if _COLOR_SUPPORTED:
        colored_prefix = f"{Colors.BRIGHT_CYAN}{prefix}{Colors.RESET}"
        colored_level = f"{color}{level}{Colors.RESET}" if level else ""
        if level:
            return f"{colored_prefix} {colored_level} {message}"
        else:
            return f"{colored_prefix} {message}"
    else:
        if level:
            return f"{prefix} {level} {message}"
        else:
            return f"{prefix} {message}"


def log_info(message: str):
    """Log an info message."""
    print(_format_message("", message, Colors.RESET))


def log_success(message: str):
    """Log a success message."""
    print(_format_message("✓", message, Colors.BRIGHT_GREEN))


def log_warning(message: str):
    """Log a warning message."""
    print(_format_message("⚠", message, Colors.BRIGHT_YELLOW))


def log_error(message: str):
    """Log an error message."""
    print(_format_message("✗", message, Colors.BRIGHT_RED), file=sys.stderr)


def log_debug(message: str):
    """Log a debug message."""
    print(_format_message("DEBUG", message, Colors.BRIGHT_BLUE))


def log(message: str, level: str = "INFO"):
    """
    Generic log function.
    
    Args:
        message: The message to log
        level: Log level (INFO, SUCCESS, WARNING, ERROR, DEBUG)
    """
    level_upper = level.upper()
    if level_upper == "SUCCESS":
        log_success(message)
    elif level_upper == "WARNING":
        log_warning(message)
    elif level_upper == "ERROR":
        log_error(message)
    elif level_upper == "DEBUG":
        log_debug(message)
    else:
        log_info(message)

