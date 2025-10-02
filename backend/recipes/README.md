# Backend - AI Recipe App

This is the backend component of the AI Recipe App, built using Django and Python.

## Features

*   Receives image uploads from the frontend.
*   Uses Google Gemini AI to generate recipes from images.
*   Provides a REST API for the frontend to consume.

## Technologies Used

*   Django
*   Python
*   Google Gemini AI
*   Docker
*   REST API

## Prerequisites

*   Python 3.9 or higher
*   Pip

## Installation

1.  Navigate to the backend directory:
    ```shell
    cd backend/recipes
    ```
2.  Create a virtual environment:
    ```shell
    python -m venv .venv
    ```
3.  Activate the virtual environment:
    ```shell
    .venv\Scripts\activate  # Windows
    source .venv/bin/activate # macOS/Linux
    ```
4.  Install the dependencies:
    ```shell
    pip install -r requirements.txt
    ```

## Configuration

1.  Set the `GOOGLE_API_KEY` environment variable with your Google Gemini AI API key.

## Usage

Run the Django development server:

```shell
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/recipes/generate/`.

## Docker

A Dockerfile is provided for containerizing the backend application.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

[MIT](LICENSE)