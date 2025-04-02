# Credit Card Fraud Detection System

A machine learning-based web application for detecting fraudulent credit card transactions in real-time.

## Features

- Real-time fraud detection for single transactions
- Batch processing of transactions via CSV upload
- Transaction history tracking
- User-friendly interface with visual feedback
- Responsive design for all devices
- Secure data handling

## Tech Stack

- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Backend**: Python (Flask)
- **Machine Learning**: scikit-learn
- **Database**: SQLite
- **Other Libraries**: pandas, numpy

## Team Members

1. **Suraj Kumar** - Backend Developer
2. **Sunny Kumar** - Backend Developer
3. **Shamshad Alam** - ML Engineer
4. **Suhani Kumari** - UI/UX Designer

## Setup Instructions

1. Clone the repository:
```bash
git clone <https://github.com/surajsri23/SwiftSecure.git>
cd credit-card-fraud-detection
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
credit-card-fraud-detection/
├── app.py                 # Main Flask application
├── model.py              # Machine learning model
├── requirements.txt      # Python dependencies
├── static/              # Static files
│   ├── css/            # CSS styles
│   ├── js/             # JavaScript files
│   └── images/         # Image assets
└── templates/          # HTML templates
    └── index.html      # Main page template
```

## Usage

1. **Single Transaction Check**:
   - Fill in the transaction details
   - Click "Analyze" to check for fraud
   - View the result with color-coded feedback

2. **Batch Upload**:
   - Prepare a CSV file with transaction data
   - Click "Choose File" to select the CSV
   - Click "Upload & Scan" to process all transactions
   - View the results summary

3. **Transaction History**:
   - View all processed transactions
   - Filter by status (Safe/Fraudulent)
   - Clear history when needed

## Security Features

- Input validation
- File type verification
- Secure data handling
- Error handling
- User confirmation for critical actions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Credit Card Fraud Detection Dataset from Kaggle
- Team members for their contributions
- Open-source community for tools and libraries 