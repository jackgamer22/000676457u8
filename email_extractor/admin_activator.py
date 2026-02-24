import hashlib
import sys
from colorama import Fore, Style, init

init(autoreset=True)

BANNER = f"""
{Fore.GREEN}{Style.BRIGHT}
 █████  ██████  ███    ███ ██ ███    ██
██   ██ ██   ██ ████  ████ ██ ████   ██
███████ ██   ██ ██ ████ ██ ██ ██ ██  ██
██   ██ ██   ██ ██  ██  ██ ██ ██  ██ ██
██   ██ ██████  ██      ██ ██ ██   ████

 █████   ██████ ████████ ██ ██    ██  █████  ████████  ██████  ██████
██   ██ ██         ██    ██ ██    ██ ██   ██    ██    ██    ██ ██   ██
███████ ██         ██    ██ ██    ██ ███████    ██    ██    ██ ██████
██   ██ ██         ██    ██  ██  ██  ██   ██    ██    ██    ██ ██   ██
██   ██  ██████    ██    ██   ████   ██   ██    ██     ██████  ██   ██
"""

def generate_token(hwid):
    """Generates a license token for a given HWID."""
    salt = "MAGXXIC_SALT"
    token = hashlib.sha256((hwid.strip().upper() + salt).encode()).hexdigest().upper()[:12]
    return token

if __name__ == "__main__":
    print(BANNER)
    print(f"{Fore.BLUE}{'='*60}")
    print(f"{Fore.YELLOW}           MAGXXIC TOKEN GENERATOR")
    print(f"{Fore.BLUE}{'='*60}\n")

    while True:
        try:
            hwid = input(f"{Fore.CYAN}Enter HWID from User (or 'exit' to quit): {Fore.WHITE}").strip()
            if hwid.lower() == 'exit':
                break

            if not hwid:
                continue

            token = generate_token(hwid)
            print(f"\n{Fore.GREEN}SUCCESS! {Fore.YELLOW}Generated Token for {Fore.WHITE}{hwid}:")
            print(f"{Fore.MAGENTA}{Style.BRIGHT}>>> {token} <<<\n")
            print(f"{Fore.BLUE}{'-'*60}")
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"{Fore.RED}Error: {e}")
