"""BarGrids Cloud Run Service."""
import logging
import os
import yaml
from flask import Flask
from flask import Response
from flask import render_template
from flask import request
from flask import send_file


app = Flask(__name__)


def get_puzzle_data(slug):
    """Return the data from a puzzle yaml file path."""
    with open(f"{slug}.yaml", "r") as stream:
        try:
            return yaml.safe_load(stream)
        except yaml.YAMLError as err:
            logging.error(f"Failed to open puzzle file: {slug}: {err}")
    return None


@app.route("/index")
def index():
    puzzles = [
        {"name": "For Beginners", "slug": "for_beginners"},
    ]
    return render_template("index.html", puzzles=puzzles)


@app.route("/", methods=["GET", "POST"])
def new_bargrid():
    """Create a new BarGrid."""
    # if request.method == "POST":
    #     depth = request.form.get("depth")
    #     width = request.form.get("width")
    #     if depth.isnumeric() and width.isnumeric():
    #         return render_template(
    #             "new_puzzle.html",
    #             depth=int(depth),
    #             width=int(width),
    #         )
    # return render_template("new_puzzle.html")
    return send_file("bargrids/index.html", mimetype="text/html")



@app.route("/puzzles/<slug>")
def puzzle(slug):
    puzzle_data = get_puzzle_data(slug)
    return render_template("puzzle.html", **puzzle_data)


@app.route("/puzzles/<slug>.css")
def puzzle_stylesheet(slug):
    border = 4
    font_family = "Arial, Helvetica, sans-serif"
    size = 50
    puzzle_data = get_puzzle_data(slug)
    response = render_template("puzzle.css",
        border=border,
        font_family=font_family,
        size=size,
        **puzzle_data
    )
    return Response(response, 200, mimetype="text/css")


@app.route("/bargrids/script.js")
def script_js():
    """Send javascript file."""
    return send_file("bargrids/script.js", mimetype="text/javascript")


@app.route("/bargrids/styles.css")
def new_puzzle():
    """CSS for creating a new puzzle."""
    return send_file("bargrids/styles.css", mimetype="text/css")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))