#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "$(id -u)" != "0" ]]; then
  echo "bootstrap.sh must run as root" >&2
  exit 1
fi

if [[ -z "${DEPLOY_PUBLIC_KEY:-}" ]]; then
  echo "DEPLOY_PUBLIC_KEY is required" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y ca-certificates curl gnupg git rsync sudo ufw unzip build-essential

install -m 0755 -d /etc/apt/keyrings
if [[ ! -f /etc/apt/keyrings/docker.asc ]]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME:-$VERSION_CODENAME} stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

if ! id deploy >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" deploy
fi

usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
printf '%s\n' "$DEPLOY_PUBLIC_KEY" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys

install -d -m 755 /opt/songhay
install -d -m 755 /opt/songhay/source /opt/songhay/runtime /opt/songhay/runtime/releases
install -d -m 700 /opt/songhay/env /opt/songhay/backups
install -d -m 755 /opt/songhay/scripts
chown -R deploy:deploy /opt/songhay

if [[ ! -f /swapfile ]]; then
  fallocate -l 3G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=3072
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >> /etc/fstab
elif ! swapon --show=NAME | grep -qx /swapfile; then
  swapon /swapfile
fi

sudo -H -u deploy bash -lc 'if ! command -v bun >/dev/null 2>&1; then curl -fsSL https://bun.sh/install | bash; fi'

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "Bootstrap complete"
