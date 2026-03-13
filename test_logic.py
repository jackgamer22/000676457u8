from email_extractor.email_extractor import detect_imap_server, mask_email

def test_auto_detection():
    test_cases = {
        "user@gmail.com": "imap.gmail.com",
        "user@yahoo.com": "imap.mail.yahoo.com",
        "user@outlook.com": "outlook.office365.com",
        "user@ionos.com": "imap.ionos.com",
        "user@customdomain.io": "imap.customdomain.io"
    }

    for email, expected in test_cases.items():
        result = detect_imap_server(email)
        print(f"Email: {email} | Expected: {expected} | Result: {result}")
        assert result == expected

def test_masking():
    test_cases = {
        "info@target.com": "info@t******.com",
        "admin@corp.net": "admin@c******.net",
        "user@sub.domain.com": "user@s******.domain.com"
    }

    for email, expected in test_cases.items():
        result = mask_email(email)
        print(f"Email: {email} | Expected: {expected} | Result: {result}")
        assert result == expected

if __name__ == "__main__":
    print("Testing Auto-Detection...")
    test_auto_detection()
    print("\nTesting Masking...")
    test_masking()
    print("\nAll unit tests passed!")
