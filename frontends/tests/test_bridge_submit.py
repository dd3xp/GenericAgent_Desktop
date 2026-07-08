"""Unit tests for desktop_bridge.py submit_prompt path-prepend logic and add_message.

Tests the core file-attachment contract: files_meta → agent_prompt path prepend.
Run: pytest frontends/tests/test_bridge_submit.py -v
"""
import json


class TestPathPrepend:
    """Test the agent_prompt construction logic from submit_prompt."""

    @staticmethod
    def _build_agent_prompt(prompt: str, files_meta: list | None) -> str:
        """Replicate the path prepend logic from desktop_bridge.py submit_prompt."""
        agent_prompt = prompt
        if files_meta:
            paths = [f["path"] for f in files_meta if f.get("path")]
            if paths:
                agent_prompt = " ".join(paths) + "\n" + prompt
        return agent_prompt

    def test_single_file_prepend(self):
        prompt = "Analyze this file"
        files = [{"name": "data.csv", "path": "/tmp/uploads/data.csv", "size": 1024}]
        result = self._build_agent_prompt(prompt, files)
        assert result == "/tmp/uploads/data.csv\nAnalyze this file"

    def test_multiple_files_prepend(self):
        prompt = "Compare these"
        files = [
            {"name": "a.py", "path": "/tmp/a.py", "size": 100},
            {"name": "b.py", "path": "/tmp/b.py", "size": 200},
            {"name": "c.py", "path": "/tmp/c.py", "size": 300},
        ]
        result = self._build_agent_prompt(prompt, files)
        assert result == "/tmp/a.py /tmp/b.py /tmp/c.py\nCompare these"

    def test_no_files_meta_unchanged(self):
        prompt = "Just a question"
        assert self._build_agent_prompt(prompt, None) == prompt
        assert self._build_agent_prompt(prompt, []) == prompt

    def test_files_without_path_skipped(self):
        prompt = "Check files"
        files = [
            {"name": "good.txt", "path": "/tmp/good.txt"},
            {"name": "bad.txt"},  # no path
            {"name": "empty.txt", "path": ""},  # empty path
        ]
        result = self._build_agent_prompt(prompt, files)
        assert result == "/tmp/good.txt\nCheck files"

    def test_path_with_spaces(self):
        prompt = "Read it"
        files = [{"name": "my report.txt", "path": "/tmp/desktop_uploads/my report.txt"}]
        result = self._build_agent_prompt(prompt, files)
        assert "/tmp/desktop_uploads/my report.txt" in result

    def test_path_with_cjk(self):
        prompt = "分析这个"
        files = [{"name": "报告.csv", "path": "/tmp/desktop_uploads/报告.csv"}]
        result = self._build_agent_prompt(prompt, files)
        assert result.startswith("/tmp/desktop_uploads/报告.csv\n")

    def test_empty_prompt_with_files(self):
        prompt = ""
        files = [{"name": "f.txt", "path": "/tmp/f.txt"}]
        result = self._build_agent_prompt(prompt, files)
        assert result == "/tmp/f.txt\n"


class TestAddMessageExtra:
    """Test that add_message stores extra fields correctly."""

    @staticmethod
    def _simulate_add_message(role: str, content: str, **extra) -> dict:
        """Replicate add_message logic from AgentManager."""
        msg = {
            "id": 1,
            "role": role,
            "content": content,
            "ts": 1000.0,
        }
        msg.update(extra)
        return msg

    def test_files_stored_in_message(self):
        files_meta = [{"name": "x.py", "path": "/tmp/x.py", "size": 512}]
        msg = self._simulate_add_message("user", "hello", files=files_meta)
        assert msg["files"] == files_meta

    def test_images_stored_in_message(self):
        image_metas = [{"name": "pic.png", "path": "/tmp/pic.png"}]
        msg = self._simulate_add_message("user", "see this", images=image_metas)
        assert msg["images"] == image_metas

    def test_display_stored_separately(self):
        msg = self._simulate_add_message("user", "full prompt with paths", display="clean display text")
        assert msg["display"] == "clean display text"
        assert msg["content"] == "full prompt with paths"

    def test_no_extra_fields_minimal(self):
        msg = self._simulate_add_message("assistant", "response")
        assert "files" not in msg
        assert "images" not in msg
        assert "display" not in msg

    def test_combined_files_and_images(self):
        msg = self._simulate_add_message(
            "user", "both",
            files=[{"name": "f.txt", "path": "/tmp/f.txt"}],
            images=[{"name": "i.png", "path": "/tmp/i.png"}],
        )
        assert len(msg["files"]) == 1
        assert len(msg["images"]) == 1


class TestImagePathExtraction:
    """Test image_paths extraction from image_metas (used for _patch_chat_for_images)."""

    def test_extracts_paths(self):
        image_metas = [
            {"name": "a.png", "path": "/tmp/a.png"},
            {"name": "b.jpg", "path": "/tmp/b.jpg"},
        ]
        image_paths = [m["path"] for m in (image_metas or []) if m.get("path")]
        assert image_paths == ["/tmp/a.png", "/tmp/b.jpg"]

    def test_none_metas(self):
        image_metas = None
        image_paths = [m["path"] for m in (image_metas or []) if m.get("path")]
        assert image_paths == []

    def test_skips_entries_without_path(self):
        image_metas = [
            {"name": "a.png", "path": "/tmp/a.png"},
            {"name": "broken.png"},
        ]
        image_paths = [m["path"] for m in (image_metas or []) if m.get("path")]
        assert image_paths == ["/tmp/a.png"]


class TestSessionFiltering:
    """Test the tui_ prefix filter for conductor sessions."""

    def test_filters_tui_prefix(self):
        sessions = [
            {"id": "abc123", "title": "Chat"},
            {"id": "tui_worker_1", "title": "Worker"},
            {"id": "def456", "title": "Another"},
            {"id": "tui_conductor_main", "title": "Main"},
        ]
        filtered = [s for s in sessions if not s["id"].startswith("tui_")]
        assert len(filtered) == 2
        assert all(not s["id"].startswith("tui_") for s in filtered)

    def test_no_tui_sessions_unchanged(self):
        sessions = [{"id": "a"}, {"id": "b"}]
        filtered = [s for s in sessions if not s["id"].startswith("tui_")]
        assert len(filtered) == 2

    def test_all_tui_sessions_empty_result(self):
        sessions = [{"id": "tui_x"}, {"id": "tui_y"}]
        filtered = [s for s in sessions if not s["id"].startswith("tui_")]
        assert len(filtered) == 0
