"""Exercise the built starter at a project subpath in Chromium."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import tempfile
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    screenshots = ROOT / "browser-checks"
    screenshots.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        shutil.copytree(ROOT / "dist", Path(temporary) / "example-tool")
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=temporary))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch()
                page = browser.new_page(viewport={"width": 1280, "height": 1000})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/example-tool/")
                page.wait_for_selector("#bars .row")
                page.select_option("#period","2025")
                page.select_option("#brand","Rogers/Shaw")
                assert "6,485" in page.locator("#metrics").inner_text()
                page.select_option("#metric","resolution")
                assert "87.9%" in page.locator("#history").inner_text()
                assert page.locator("#issuefile").get_attribute("href").endswith(".xlsx")
                import io, zipfile
                package = io.BytesIO()
                with zipfile.ZipFile(package, "w", zipfile.ZIP_DEFLATED) as archive:
                    rows = [["Complaint","Service Provider","Primary Category","Province","Line of Business"],["a","Provider","Billing","Nova Scotia","Wireless"],["a","Provider","Service","Nova Scotia","Wireless"]]
                    markup = "<worksheet><sheetData>"
                    for i, cells in enumerate(rows, 1):
                        markup += '<row r="%d">' % i
                        for j, value in enumerate(cells):
                            markup += f'<c r="{chr(65+j)}{i}" t="inlineStr"><is><t>{value}</t></is></c>'
                        markup += "</row>"
                    archive.writestr("xl/worksheets/sheet2.xml", markup + "</sheetData></worksheet>")
                page.locator("#file").set_input_files({"name":"test.xlsx","mimeType":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","buffer":package.getvalue()})
                page.wait_for_selector("#local:visible")
                assert "2 issue rows across 1 distinct complaint" in page.locator("#localCount").inner_text()
                page.click("#clear")
                assert page.locator("#local").is_hidden()
                page.screenshot(path=str(screenshots / "desktop.png"), full_page=True)
                page.set_viewport_size({"width": 390, "height": 844})
                assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
                page.screenshot(path=str(screenshots / "mobile.png"), full_page=True)
                assert not errors, errors
                browser.close()
            print("Browser checks passed: published records, interactive filters and mobile layout")
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
