
import os
import secrets
import string
from urllib.parse import urlencode

import requests
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash
)

app = Flask(__name__)
app.secret_key = os.environ.get(
    "FLASK_SECRET_KEY", "vervang-dit-door-een-lange-geheime-sleutel"
)

CLIENT_ID = os.environ.get("DISCORD_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("DISCORD_CLIENT_SECRET", "")
REDIRECT_URI = os.environ.get(
    "DISCORD_REDIRECT_URI",
    "http://127.0.0.1:5000/callback"
)


def generate_password(length=20):
    length = max(12, min(int(length), 64))
    symbols = "!@#$%^&*()-_=+"
    alphabet = string.ascii_letters + string.digits + symbols

    chars = [
        secrets.choice(string.ascii_lowercase),
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.digits),
        secrets.choice(symbols),
    ]

    chars.extend(
        secrets.choice(alphabet)
        for _ in range(length - len(chars))
    )

    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


@app.get("/")
def index():
    return render_template("index.html", results=[])


@app.post("/generate")
def generate():
    count = max(1, min(request.form.get("count", 3, type=int), 10))
    length = max(12, min(request.form.get("length", 20, type=int), 64))

    results = []
    for _ in range(count):
        email = f"test-{secrets.token_hex(4)}@example.invalid"
        password = generate_password(length)
        results.append({"email": email, "password": password})

    return render_template("index.html", results=results)


@app.get("/login/discord")
def discord_login():
    if not CLIENT_ID or not CLIENT_SECRET:
        flash("Configureer eerst je Discord OAuth-gegevens.", "error")
        return redirect(url_for("index"))

    state = secrets.token_urlsafe(24)
    session["oauth_state"] = state

    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": "identify",
        "state": state,
    }

    return redirect(
        "https://discord.com/oauth2/authorize?" + urlencode(params)
    )


@app.get("/callback")
def callback():
    code = request.args.get("code")
    state = request.args.get("state")
    expected = session.pop("oauth_state", None)

    if (
        not code or not state or not expected
        or not secrets.compare_digest(state, expected)
    ):
        flash("Ongeldige Discord-login. Probeer opnieuw.", "error")
        return redirect(url_for("index"))

    try:
        token_response = requests.post(
            "https://discord.com/api/v10/oauth2/token",
            data={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": REDIRECT_URI,
            },
            timeout=10,
        )
        token_response.raise_for_status()
        access_token = token_response.json()["access_token"]

        user_response = requests.get(
            "https://discord.com/api/v10/users/@me",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        user_response.raise_for_status()
        user = user_response.json()

        session["discord_user"] = {
            "id": user["id"],
            "username": user.get("global_name") or user["username"],
        }

        flash("Je bent ingelogd met Discord!", "success")

    except requests.RequestException:
        app.logger.exception("Discord OAuth-fout")
        flash("Discord-login is mislukt.", "error")

    return redirect(url_for("index"))


@app.post("/logout")
def logout():
    session.pop("discord_user", None)
    flash("Je bent uitgelogd.", "success")
    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run(debug=False)