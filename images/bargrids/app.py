"""BarGrids Cloud Run Service."""
import logging
import os
import yaml
from flask import Flask
from flask import Response
from flask import render_template


app = Flask(__name__)


def get_puzzle_data(stub):
    """Return the data from a puzzle yaml file path."""
    with open(f"{stub}.yaml", "r") as stream:
        try:
            return yaml.safe_load(stream)
        except yaml.YAMLError as err:
            logging.error(f"Failed to open puzzle file: {stub}: {err}")
    return None


@app.route("/")
def hello_world():
    stub = "for_beginners"
    puzzle_data = get_puzzle_data(stub)
    return render_template("puzzle.html", **puzzle_data)


@app.route("/<stub>.css")
def puzzle_stylesheet(stub):
    border = 4
    font_family = "Arial, Helvetica, sans-serif"
    size = 50
    puzzle_data = get_puzzle_data(stub)
    response = render_template("puzzle.css",
        border=border,
        font_family=font_family,
        size=size,
        **puzzle_data
    )
    return Response(response, 200, mimetype="text/css")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))