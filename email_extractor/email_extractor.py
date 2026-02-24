import imaplib
import email
import re
import dns.resolver
from colorama import Fore, Style, init
from collections import defaultdict
import sys
import getpass

# Initialize colorama
init(autoreset=True)

BANNER = f"""
{Fore.MAGENTA}{Style.BRIGHT}
 ███    ███  █████   ██████  ██   ██ ██   ██ ██  ██████
 ████  ████ ██   ██ ██       ██  ██   ██ ██  ██ ██
 ██ ████ ██ ███████ ██   ███  █████     ███   ██ ██
 ██  ██  ██ ██   ██ ██    ██ ██  ██   ██ ██  ██ ██
 ██      ██ ██   ██  ██████  ██   ██ ██   ██ ██  ██████

      ███████ ██    ██  ██████ ██   ██ ██████  ██████
      ██      ██    ██ ██      ██  ██       ██ ██   ██
      ███████ ██    ██ ██      █████    █████  ██████
           ██  ██  ██  ██      ██  ██       ██ ██   ██
      ███████   ████    ██████ ██   ██ ██████  ██   ██
{Style.RESET_ALL}
"""

def get_mx_server(domain):
    """Retrieves the MX server for a given domain."""
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        # Get the highest priority record (lowest preference value)
        mx_records = sorted(answers, key=lambda r: r.preference)
        return str(mx_records[0].exchange).rstrip('.')
    except Exception:
        return "Unknown/No MX Record"

def print_dashboard(stats):
    """Prints a live dashboard line."""
    sys.stdout.write('\r')
    status_line = f"{Fore.CYAN}Processed: {stats['processed']} | {Fore.GREEN}Found: {stats['found']} | {Fore.YELLOW}Current Folder: {stats['current_folder']}"
    sys.stdout.write(status_line)
    sys.stdout.flush()

def extract_emails_from_mailbox(username, password, imap_server):
    """
    Logs into an email inbox and extracts email addresses,
    grouping them by domain and MX server with live reporting.
    """
    print(BANNER)
    print(f"{Fore.BLUE}{'='*80}")
    print(f"{Fore.YELLOW}Target Account: {Fore.WHITE}{username}")
    print(f"{Fore.YELLOW}IMAP Server:    {Fore.WHITE}{imap_server}")
    print(f"{Fore.BLUE}{'='*80}\n")

    stats = {'processed': 0, 'found': 0, 'current_folder': 'inbox'}
    all_emails = set()

    try:
        # Connect to the IMAP server
        mail = imaplib.IMAP4_SSL(imap_server)
        mail.login(username, password)
        mail.select("inbox")

        # Search for all emails
        result, data = mail.search(None, "ALL")
        email_ids = data[0].split()

        for i, email_id in enumerate(email_ids):
            stats['processed'] = i + 1
            result, msg_data = mail.fetch(email_id, "(RFC822)")
            raw_email = msg_data[0][1]
            raw_email_string = raw_email.decode('utf-8', 'ignore')
            email_message = email.message_from_string(raw_email_string)

            found_in_msg = set()
            # Extract email addresses from headers
            for header in ['From', 'To', 'Cc', 'Bcc']:
                header_value = email_message[header]
                if header_value:
                    emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", str(header_value))
                    found_in_msg.update(emails)

            # Extract email addresses from body
            for part in email_message.walk():
                if part.get_content_type() in ["text/plain", "text/html"]:
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode('utf-8', 'ignore')
                            emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", body)
                            found_in_msg.update(emails)
                    except Exception:
                        continue

            for em in found_in_msg:
                if em not in all_emails:
                    all_emails.add(em)
                    stats['found'] += 1

            print_dashboard(stats)

        mail.close()
        mail.logout()

        print(f"\n\n{Fore.GREEN}{Style.BRIGHT}Extraction Phase Complete!")
        print(f"{Fore.CYAN}Processing MX Lookups and Grouping Results...")

        # Grouping phase
        grouped_data = defaultdict(lambda: defaultdict(list)) # {mx_server: {domain: [emails]}}
        domain_to_mx = {}

        sorted_emails = sorted(list(all_emails))
        for em in sorted_emails:
            domain = em.split('@')[-1].lower()
            if domain not in domain_to_mx:
                domain_to_mx[domain] = get_mx_server(domain)
            mx = domain_to_mx[domain]
            grouped_data[mx][domain].append(em)

        # Final Organized Report
        print(f"\n{Fore.MAGENTA}{Style.BRIGHT}--- FINAL RESULTS REPORT ---")
        for mx, domains in sorted(grouped_data.items()):
            print(f"\n{Fore.YELLOW}Server (MX): {Fore.WHITE}{mx}")
            for domain, emails in sorted(domains.items()):
                print(f"  {Fore.CYAN}Domain: {Fore.WHITE}{domain} {Fore.CYAN}({len(emails)} emails)")
                for e in emails:
                    print(f"    {Fore.BLACK}{Style.BRIGHT}» {Fore.WHITE}{e}")

        print(f"\n{Fore.BLUE}{'='*80}")
        print(f"{Fore.GREEN}{Style.BRIGHT}TOTAL UNIQUE EMAILS EXTRACTED: {len(all_emails)}")
        print(f"{Fore.BLUE}{'='*80}")

        return list(all_emails)

    except Exception as e:
        print(f"\n{Fore.RED}{Style.BRIGHT}CRITICAL ERROR: {e}")
        return []

if __name__ == "__main__":
    # Interactive input for better usability
    print(BANNER)
    try:
        user = input(f"{Fore.YELLOW}Enter Email: {Fore.WHITE}")
        pwd = getpass.getpass(f"{Fore.YELLOW}Enter Password: {Fore.WHITE}")
        server = input(f"{Fore.YELLOW}Enter IMAP Server (e.g. imap.gmail.com): {Fore.WHITE}")

        if user and pwd and server:
            extract_emails_from_mailbox(user, pwd, server)
        else:
            print(f"{Fore.RED}Missing credentials. Exiting.")
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Operation cancelled by user.")
