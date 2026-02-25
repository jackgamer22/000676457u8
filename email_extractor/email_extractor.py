import imaplib
import email
import re
import dns.resolver
from colorama import Fore, Style, init
from collections import defaultdict
import sys
import getpass
import uuid
import hashlib
import random
import socks
import socket

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

class SocksIMAP4SSL(imaplib.IMAP4_SSL):
    """IMAP4_SSL client that routes traffic through a SOCKS proxy."""
    def __init__(self, host, port, proxy_addr, proxy_port, proxy_type=socks.SOCKS5):
        self.proxy_addr = proxy_addr
        self.proxy_port = int(proxy_port)
        self.proxy_type = proxy_type
        imaplib.IMAP4_SSL.__init__(self, host, port)

    def _create_socket(self, timeout=None):
        sock = socks.socksocket()
        if timeout is not None:
            sock.settimeout(timeout)
        sock.set_proxy(self.proxy_type, self.proxy_addr, self.proxy_port)
        sock.connect((self.host, self.port))
        return self.ssl_context.wrap_socket(sock, server_hostname=self.host)

def get_hwid():
    """Generates a simple Hardware ID based on the system's MAC address."""
    return hashlib.sha256(str(uuid.getnode()).encode()).hexdigest().upper()[:16]

def verify_license():
    """Asks for a license token and verifies it (simple placeholder logic)."""
    hwid = get_hwid()
    print(f"{Fore.CYAN}YOUR HWID: {Fore.WHITE}{hwid}")
    print(f"{Fore.YELLOW}Please contact admin to get your token for this HWID.")

    # In a real system, the token would be a hash of the HWID + a secret salt
    # For this example, we'll use a simple "SECRET_" + HWID logic
    expected_token = hashlib.sha256((hwid + "MAGXXIC_SALT").encode()).hexdigest().upper()[:12]

    # For user convenience during testing, if they enter "DEBUG", it passes
    token = input(f"{Fore.YELLOW}Enter Token: {Fore.WHITE}").strip()

    if token == expected_token or token == "DEBUG":
        print(f"{Fore.GREEN}License Verified Successfully! Welcome back.")
        return True
    else:
        print(f"{Fore.RED}Invalid Token! Please check with admin.")
        return False

def validate_proxy(proxy, imap_server, timeout=5):
    """Validates if a SOCKS5 proxy is live and can connect to the target IMAP server on port 993."""
    try:
        p_host, p_port = proxy.split(':')
        sock = socks.socksocket()
        sock.settimeout(timeout)
        sock.set_proxy(socks.SOCKS5, p_host, int(p_port))
        # We only check if we can establish a connection to port 993
        sock.connect((imap_server, 993))
        sock.close()
        return True
    except:
        return False

def get_mx_server(domain):
    """Retrieves the MX server for a given domain."""
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        mx_records = sorted(answers, key=lambda r: r.preference)
        return str(mx_records[0].exchange).rstrip('.')
    except Exception:
        return "Unknown/No MX Record"

def print_dashboard(stats):
    """Prints a live dashboard line."""
    sys.stdout.write('\r')
    status_line = f"{Fore.CYAN}Processed: {stats['processed']} | {Fore.GREEN}Found: {stats['found']} | {Fore.YELLOW}Proxy: {stats['current_proxy']}"
    sys.stdout.write(status_line)
    sys.stdout.flush()

def load_proxies():
    """Loads proxies from proxies.txt."""
    try:
        with open("proxies.txt", "r") as f:
            proxies = [line.strip() for line in f if line.strip()]
        return proxies
    except FileNotFoundError:
        return []

def extract_emails_from_mailbox(username, password, imap_server, proxy=None):
    """
    Logs into an email inbox and extracts email addresses.
    """
    stats = {'processed': 0, 'found': 0, 'current_proxy': proxy if proxy else 'Direct'}
    all_emails = set()

    try:
        if proxy:
            # Simple host:port parsing
            p_host, p_port = proxy.split(':')
            mail = SocksIMAP4SSL(imap_server, 993, p_host, p_port)
        else:
            mail = imaplib.IMAP4_SSL(imap_server)

        mail.login(username, password)
        mail.select("inbox")

        result, data = mail.search(None, "ALL")
        email_ids = data[0].split()

        for i, email_id in enumerate(email_ids):
            stats['processed'] = i + 1
            result, msg_data = mail.fetch(email_id, "(RFC822)")
            raw_email = msg_data[0][1]
            raw_email_string = raw_email.decode('utf-8', 'ignore')
            email_message = email.message_from_string(raw_email_string)

            found_in_msg = set()
            for header in ['From', 'To', 'Cc', 'Bcc']:
                header_value = email_message[header]
                if header_value:
                    emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", str(header_value))
                    found_in_msg.update(emails)

            for part in email_message.walk():
                if part.get_content_type() in ["text/plain", "text/html"]:
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode('utf-8', 'ignore')
                            emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", body)
                            found_in_msg.update(emails)
                    except: continue

            for em in found_in_msg:
                if em not in all_emails:
                    all_emails.add(em)
                    stats['found'] += 1

            print_dashboard(stats)

        mail.close()
        mail.logout()
        return all_emails

    except Exception as e:
        print(f"\n{Fore.RED}Error: {e}")
        return all_emails

def save_results(emails):
    """Saves the extracted emails to results.txt."""
    if not emails:
        print(f"{Fore.YELLOW}No emails found to save.")
        return

    filename = "results.txt"
    with open(filename, "w") as f:
        for em in sorted(list(emails)):
            f.write(em + "\n")
    print(f"\n{Fore.GREEN}Successfully saved {len(emails)} unique emails to {filename}")

if __name__ == "__main__":
    print(BANNER)
    if not verify_license():
        sys.exit()

    try:
        user = input(f"{Fore.YELLOW}Enter Email: {Fore.WHITE}")
        pwd = getpass.getpass(f"{Fore.YELLOW}Enter Password: {Fore.WHITE}")
        server = input(f"{Fore.YELLOW}Enter IMAP Server: {Fore.WHITE}")

        proxies = load_proxies()
        selected_proxy = None

        if proxies:
            print(f"{Fore.CYAN}Validating proxies from list...")
            random.shuffle(proxies)
            for p in proxies:
                if validate_proxy(p, server):
                    selected_proxy = p
                    print(f"{Fore.GREEN}[LIVE] Found working proxy: {p}")
                    break
                else:
                    print(f"{Fore.RED}[DEAD] Skipping proxy: {p}")

            if not selected_proxy:
                print(f"{Fore.RED}No live proxies found. Falling back to direct connection.")
        else:
            print(f"{Fore.YELLOW}No proxies found in proxies.txt. Using direct connection.")

        emails = extract_emails_from_mailbox(user, pwd, server, selected_proxy)

        if emails:
            print(f"\n\n{Fore.GREEN}Extraction Complete. Total Unique Found: {len(emails)}")

            # Grouping by MX for reporting
            print(f"{Fore.CYAN}Performing MX Lookups for Report...")
            grouped_data = defaultdict(lambda: defaultdict(list))
            domain_to_mx = {}
            for em in sorted(list(emails)):
                domain = em.split('@')[-1].lower()
                if domain not in domain_to_mx:
                    domain_to_mx[domain] = get_mx_server(domain)
                mx = domain_to_mx[domain]
                grouped_data[mx][domain].append(em)

            for mx, domains in sorted(grouped_data.items()):
                print(f"\n{Fore.YELLOW}Server (MX): {Fore.WHITE}{mx}")
                for dom, ems in sorted(domains.items()):
                    print(f"  {Fore.CYAN}Domain: {Fore.WHITE}{dom} ({len(ems)})")

            save_choice = input(f"\n{Fore.YELLOW}Do you want to save results? (y/n): {Fore.WHITE}").lower()
            if save_choice == 'y':
                save_results(emails)
        else:
            print(f"\n{Fore.RED}No emails extracted.")

    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Exiting...")
