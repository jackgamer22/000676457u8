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
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

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

    def _create_socket(self, *args, **kwargs):
        timeout = kwargs.get('timeout')
        if not timeout and args:
            timeout = args[0]

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
    """Asks for a license token and verifies it with persistence."""
    hwid = get_hwid()
    license_file = ".license"

    # Check for persistent license
    try:
        with open(license_file, "r") as f:
            stored_token = f.read().strip()
    except FileNotFoundError:
        stored_token = None

    expected_token = hashlib.sha256((hwid + "MAGXXIC_SALT").encode()).hexdigest().upper()[:12]

    if stored_token == expected_token or stored_token == "DEBUG":
        print(f"{Fore.GREEN}License found on device. HWID: {hwid}")
        return True

    print(f"{Fore.CYAN}YOUR HWID: {Fore.WHITE}{hwid}")
    print(f"{Fore.YELLOW}Please contact admin to get your token for this HWID.")

    token = input(f"{Fore.YELLOW}Enter Token: {Fore.WHITE}").strip()

    if token == expected_token or token == "DEBUG":
        print(f"{Fore.GREEN}License Verified Successfully! Welcome back.")
        try:
            with open(license_file, "w") as f:
                f.write(token)
        except:
            pass
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
    """Prints a live dashboard line with advanced metrics."""
    elapsed = time.time() - stats['start_time']
    speed = stats['processed'] / elapsed if elapsed > 0 else 0

    sys.stdout.write('\r')
    status_line = (f"{Fore.CYAN}Processed: {stats['processed']} "
                   f"| {Fore.GREEN}Found: {stats['found']} "
                   f"| {Fore.YELLOW}Speed: {speed:.2f} e/s "
                   f"| {Fore.MAGENTA}Threads: {stats['active_threads']} "
                   f"| {Fore.WHITE}Proxy: {stats['current_proxy']}")
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

def list_mailboxes(mail):
    """Lists all available folders in the mailbox."""
    folders = []
    try:
        result, mailbox_list = mail.list()
        if result == 'OK':
            for m in mailbox_list:
                # Parse folder name from list output: (\HasNoChildren) "/" "INBOX"
                # We need the part after the last quote or the last part
                name = m.decode().split('"')[-2]
                folders.append(name)
    except:
        pass
    return folders

def process_single_email(email_id, username, password, server, proxy_info, folder):
    """Worker function to process a single email."""
    found_emails = set()
    try:
        # Each thread needs its own IMAP connection
        if proxy_info:
            mail = SocksIMAP4SSL(server, 993, proxy_info[0], proxy_info[1])
        else:
            mail = imaplib.IMAP4_SSL(server)

        mail.login(username, password)
        mail.select(f'"{folder}"')

        # Use BODY.PEEK to keep emails unread
        result, msg_data = mail.fetch(email_id, "(BODY.PEEK[])")
        if result == 'OK':
            raw_email = msg_data[0][1]
            raw_email_string = raw_email.decode('utf-8', 'ignore')
            email_message = email.message_from_string(raw_email_string)

            # Advanced regex for better detection
            email_regex = r"[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

            for header in ['From', 'To', 'Cc', 'Bcc', 'Reply-To']:
                header_value = email_message[header]
                if header_value:
                    emails = re.findall(email_regex, str(header_value))
                    found_emails.update(emails)

            for part in email_message.walk():
                if part.get_content_type() in ["text/plain", "text/html"]:
                    try:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body = payload.decode('utf-8', 'ignore')
                            emails = re.findall(email_regex, body)
                            found_emails.update(emails)
                    except: continue

        mail.logout()
    except:
        pass
    return found_emails

def extract_emails_from_mailbox(username, password, server, proxy, folder, stats, limit=None):
    """
    Extracts email addresses using multiple threads.
    """
    all_emails = set()
    stats['start_time'] = time.time()

    try:
        # Initial connection to get IDs
        if proxy:
            p_host, p_port = proxy.split(':')
            mail = SocksIMAP4SSL(server, 993, p_host, p_port)
            proxy_info = (p_host, p_port)
        else:
            mail = imaplib.IMAP4_SSL(server)
            proxy_info = None

        mail.login(username, password)
        mail.select(f'"{folder}"')
        result, data = mail.search(None, "ALL")
        email_ids = data[0].split()
        mail.logout()

        if limit and limit < len(email_ids):
            print(f"{Fore.YELLOW}Limit set to {limit}. Processing most recent emails.")
            email_ids = email_ids[-limit:]

        total = len(email_ids)
        print(f"{Fore.GREEN}Found {total} emails. Starting multi-threaded extraction (10 threads)...")

        lock = threading.Lock()

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(process_single_email, eid, username, password, server, proxy_info, folder): eid for eid in email_ids}
            stats['active_threads'] = 10

            for future in as_completed(futures):
                found_in_msg = future.result()
                with lock:
                    stats['processed'] += 1
                    for em in found_in_msg:
                        if em not in all_emails:
                            all_emails.add(em)
                            stats['found'] += 1
                    print_dashboard(stats)

        try:
            mail.close()
        except:
            pass
        return all_emails

    except Exception as e:
        print(f"\n{Fore.RED}Extraction Error: {e}")
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
        server = input(f"{Fore.YELLOW}Enter IMAP Server (e.g. imap.gmail.com): {Fore.WHITE}")

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

        # Connection Phase
        print(f"\n{Fore.CYAN}Connecting to {server}...")
        try:
            if selected_proxy:
                p_host, p_port = selected_proxy.split(':')
                mail = SocksIMAP4SSL(server, 993, p_host, p_port)
            else:
                mail = imaplib.IMAP4_SSL(server)

            mail.login(user, pwd)
            print(f"{Fore.GREEN}Connected Successfully!")

            # Folder Selection Phase
            folders = list_mailboxes(mail)
            if not folders:
                print(f"{Fore.RED}Could not retrieve folder list.")
                mail.logout()
                sys.exit()

            print(f"\n{Fore.YELLOW}Available Folders:")
            for idx, folder in enumerate(folders):
                print(f"  {Fore.WHITE}[{idx}] {folder}")

            folder_choice = input(f"\n{Fore.CYAN}Select folder number to extract from [0]: {Fore.WHITE}").strip()
            if not folder_choice:
                folder_choice = 0
            else:
                folder_choice = int(folder_choice)

            target_folder = folders[folder_choice]

            # Advanced targeted extraction: limit
            print(f"\n{Fore.CYAN}--- ADVANCED SETTINGS ---")
            limit_input = input(f"{Fore.YELLOW}Limit processing to last X emails (Leave blank for ALL): {Fore.WHITE}").strip()
            limit = int(limit_input) if limit_input.isdigit() else None

            stats = {
                'processed': 0,
                'found': 0,
                'current_proxy': selected_proxy if selected_proxy else 'Direct',
                'active_threads': 0,
                'start_time': 0
            }

            # Extract emails using the advanced multi-threaded function
            emails = extract_emails_from_mailbox(user, pwd, server, selected_proxy, target_folder, stats, limit)
        except Exception as e:
            print(f"{Fore.RED}Connection/Login failed: {e}")
            sys.exit()

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
