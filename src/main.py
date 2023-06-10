from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
import requests
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField
from wtforms.validators import DataRequired, URL
from datetime import datetime

app = Flask(__name__, template_folder="../templates")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///services.db"
app.config["SECRET_KEY"] = "your-secret-key"
db = SQLAlchemy(app)


class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    url = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    error = db.Column(db.String(128), nullable=True)
    online_since = db.Column(db.String(30), nullable=True)
    type = db.Column(db.String(10), nullable=True)


class ServiceForm(FlaskForm):
    name = StringField("Name", validators=[DataRequired()])
    url = StringField("URL", validators=[DataRequired(), URL()])
    submit = SubmitField("Add Service")


def validate_and_sterilize(input_string, max_len):
    if not input_string or len(input_string) == 0:
        raise ValueError("Input string cannot be empty.")
    if len(input_string) > max_len:
        raise ValueError("Input string cannot be longer than 40 characters.")
    if not input_string.isascii():
        raise ValueError("Input string can only contain ASCII.")

    # Sterilize for SQLite
    sterilized_string = input_string.replace("'", "''")

    return sterilized_string


@app.route("/services/refresh", methods=["GET"])
def update_services_status():
    services = Service.query.all()
    online_cnt = 0
    offline_cnt = 0
    for service in services:
        try:
            response = requests.get(service.url)
            if response.status_code == 200:
                if service.status != "Running":
                    service.online_since = datetime.now()
                service.status = "Running"
                online_cnt = online_cnt + 1
            else:
                service.status = "Not Running"
        except Exception as e:
            service.status = "Not Running"
            service.error = str(e)
            offline_cnt = offline_cnt + 1
        db.session.commit()

    return f"<html><body><p>Services refreshed! Online: {online_cnt} Offline: {offline_cnt}" \
           f"<p>You will be redirected in 3 seconds" \
           f"</p><script>var timer = setTimeout(function() {{window.location='/'}}, 3000);</script></body></html>"


@app.route("/", methods=["GET", "POST"])
def home():
    form = ServiceForm()
    if request.method == "POST":
        # Create new service
        name = validate_and_sterilize(form.name.data, 40)
        url = validate_and_sterilize(form.url.data, 256)

        if not url.startswith(("http://", "https://")):
            raise Exception("URL must begin with HTTP:// or HTTPS://")

        if url.startswith("http"):
            srv_type = "http"
        else:
            srv_type = "https"

        new_service = Service(name=name, url=url, status="Not Checked", error="None", type=srv_type)
        db.session.add(new_service)
        db.session.commit()
        return redirect(url_for("home"))

    services = Service.query.all()
    return render_template("home.html", services=services, form=form)


@app.route("/delete/<int:service_id>")
def delete_service(service_id):
    service = Service.query.get(service_id)
    if service:
        db.session.delete(service)
        db.session.commit()
    return redirect(url_for("home"))


with app.app_context():
    db.create_all()

# For development only
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)


# For production run
def waitress_get_app():
    return app
