from email_extractor.email_extractor import print_dashboard
import time
import sys

def test_dashboard():
    print("\nTesting Dashboard Display (Simulated)...")
    stats = {
        'processed': 100,
        'found': 25,
        'current_proxy': '127.0.0.1:8080',
        'active_threads': 10,
        'start_time': time.time() - 60, # 1 minute ago
        'current_folder': 'INBOX'
    }

    # We need to simulate the environment for print_dashboard
    print_dashboard(stats)
    print("\nDashboard test finished.")

if __name__ == "__main__":
    test_dashboard()
