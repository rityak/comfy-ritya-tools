import os
import server
from aiohttp import web
import nodes
from .logger import log_info, log_warning

# No custom nodes, only frontend extension
NODE_CLASS_MAPPINGS = {}
__all__ = ["NODE_CLASS_MAPPINGS"]


def check_comfy_mecha_installed():
    """
    Check if comfy-mecha is installed.
    Returns True if comfy-mecha directory exists.
    """
    custom_nodes_path = os.path.dirname(os.path.dirname(__file__))
    comfy_mecha_path = os.path.join(custom_nodes_path, "comfy-mecha")
    return os.path.exists(comfy_mecha_path)


# Define the path to our extension
workspace_path = os.path.dirname(__file__)
dist_path = os.path.join(workspace_path, "dist/example_ext")
dist_locales_path = os.path.join(workspace_path, "dist/locales")

# Log paths for debugging
log_info(f"Workspace path: {workspace_path}")
log_info(f"Dist path: {dist_path}")
log_info(f"Locales exist: {os.path.exists(dist_locales_path)}")

# Register the static route for serving our React app assets
if os.path.exists(dist_path):
    # Add the routes for the extension
    server.PromptServer.instance.app.add_routes([
        web.static("/example_ext/", dist_path),
    ])

    # Register the locale files route
    if os.path.exists(dist_locales_path):
        server.PromptServer.instance.app.add_routes([
            web.static("/locales/", dist_locales_path),
        ])
        log_info("Registered locale files route at /locales/")
    else:
        log_warning("Locale directory not found!")

    # Register API endpoint to check if comfy-mecha is installed
    async def check_mecha_installed(request):
        """API endpoint to check if comfy-mecha is installed."""
        is_installed = check_comfy_mecha_installed()
        log_info(f"API check_mecha called: comfy-mecha installed = {is_installed}")
        return web.json_response({"installed": is_installed})
    
    server.PromptServer.instance.app.router.add_get("/comfy-ritya-tools/check_mecha", check_mecha_installed)
    log_info("Registered API endpoint: /comfy-ritya-tools/check_mecha")
    log_info(f"comfy-mecha installation status: {check_comfy_mecha_installed()}")

    # Also register the standard ComfyUI extension web directory
    project_name = os.path.basename(workspace_path)

    try:
        # Method added in https://github.com/comfyanonymous/ComfyUI/pull/8357
        from comfy_config import config_parser

        project_config = config_parser.extract_node_configuration(workspace_path)
        project_name = project_config.project.name
        log_info(f"Project name read from pyproject.toml: {project_name}")
    except Exception as e:
        log_warning(f"Could not load project config, using default name '{project_name}': {e}")

    # Only register the extension web directory if comfy-mecha is installed
    # This prevents the frontend from loading if comfy-mecha is not available
    if check_comfy_mecha_installed():
        nodes.EXTENSION_WEB_DIRS[project_name] = os.path.join(workspace_path, "dist")
        log_info("Ritya Tools extension registered successfully (comfy-mecha is installed)")
    else:
        log_warning("comfy-mecha not found. Ritya Tools extension will not be registered.")
        log_info("Install comfy-mecha to enable Ritya Tools functionality.")
else:
    log_warning("Web directory not found. Frontend extension will not be available.")