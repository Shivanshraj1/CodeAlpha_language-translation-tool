# AI-Based Language Translation Tool

## Objective

The objective of this project is to create a web-based language translation tool where a user can enter text, select source and target languages, and view the translated result clearly on the screen.

## Tools and Technologies Used

- HTML for page structure
- CSS for user interface design
- JavaScript for application logic
- MyMemory Translation API for translation processing
- Web Speech API for text-to-speech output

## API Used

The project uses the MyMemory Translation API for general translations. For English-to-Hindi translation, it first uses the public Google Translate endpoint and then falls back to MyMemory if needed.

APIs used:

```text
https://api.mymemory.translated.net/get
https://translate.googleapis.com/translate_a/single
```

## API Explanation

The project sends the user's input text and selected language pair to a translation API. The API processes the text and returns the translated result in JSON format. JavaScript reads the translated text from the API response and displays it in the output text area.

Example request flow:

```text
User enters text
Selects source language and target language
Clicks Translate
JavaScript sends request to translation API
API returns translated text
Translated text is displayed on screen
```

## Main Features

- Text input area
- Source language selection
- Target language selection
- Translate button
- Translated output area
- Copy translated text button
- Text-to-speech button
- Swap language button
- Sample text button for quick testing

## Sample Test Cases

| Input Text | Source | Target | Expected Output |
|---|---|---|---|
| Hello, how are you? | English | Hindi | A Hindi translation of the sentence |
| Artificial Intelligence helps students learn faster. | English | Spanish | A Spanish translation of the sentence |
| Bonjour | French | English | Hello |

## Screenshots To Add In Report

Add these screenshots after testing:

1. Home screen of the translation tool
2. Input text before translation
3. Translated output after clicking Translate
4. Copy or Speak feature being used

## Challenges Faced

- Selecting a translation API suitable for a student project
- Handling empty input validation
- Displaying useful error messages when the internet or API is unavailable
- Creating a responsive interface for both laptop and mobile screens

## Future Scope

- Connect the project to Microsoft Translator API or Google Cloud Translation API
- Add automatic language detection from the API
- Add more languages
- Save translation history
- Add user login for personalized translation records
