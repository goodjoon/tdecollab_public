import subprocess
import json
import os
from typing import Any, Dict, List

# Define path to the compiled CLI entry point, assuming backend/ is next to dist/
CLI_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../dist/cli.js"))

class ToolsClient:
    """
    Client to interact with the tdecollab CLI tools directly via subprocess.
    Requires Node.js to be available in the environment.
    """

    @classmethod
    def _run_command(cls, service: str, resource: str, action: str, *args) -> Any:
        command = ["node", CLI_PATH, service, resource, action] + list(args) + ["--json"]
        
        try:
            # We assume JSON output from the CLI
            result = subprocess.run(command, capture_output=True, text=True, check=True)
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                # Fallback if not proper JSON
                return {"text_output": result.stdout}
        except subprocess.CalledProcessError as e:
            raise Exception(f"Tool CLI Error: {e.stderr or e.stdout}")

    @classmethod
    def jira_issue_create(cls, project_key: str, issue_type: str, summary: str, description: str = "", labels: List[str] = None) -> Dict:
        args = ["--project", project_key, "--type", issue_type, "--summary", summary]
        if description:
            args.extend(["--description", description])
        if labels:
            args.extend(["--labels", ",".join(labels)])
        return cls._run_command("jira", "issue", "create", *args)

    @classmethod
    def jira_issue_transition(cls, issue_key: str, to_status: str) -> Dict:
        return cls._run_command("jira", "issue", "transition", issue_key, "--to", to_status)

    @classmethod
    def confluence_page_create(cls, space_key: str, title: str, file_path: str) -> Dict:
        return cls._run_command("confluence", "page", "create", "--space", space_key, "--title", title, "--file", file_path)

    @classmethod
    def gitlab_project_get(cls, project_id: str) -> Dict:
        return cls._run_command("gitlab", "project", "get", project_id)

tools_client = ToolsClient()
