#!/bin/zsh
# Copy the Android fastlane lane into android/fastlane, fetch the upload
# keystore, and fetch the Play service account JSON when it exists.
# AWS profile a1 and region us-east-1 match scripts/fastlane.sh.
set -euo pipefail

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
app_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
cd "$app_dir"

mkdir -p ./android/fastlane
cp -f ./fastlane_assets/android/* ./android/fastlane

"$script_dir/android-release-env.sh"

play_key="$app_dir/android/fastlane/play-store-key.json"
err=$(mktemp)
cleanup() {
  rm -f "$err"
}
trap cleanup EXIT

echo "Fetching oslynstudio/play-store-key"
if aws secretsmanager get-secret-value \
  --profile a1 \
  --region us-east-1 \
  --secret-id oslynstudio/play-store-key \
  --query SecretString \
  --output text > "$play_key" 2>"$err"; then
  if [[ ! -s "$play_key" ]]; then
    rm -f "$play_key"
    echo "Secret oslynstudio/play-store-key was empty." >&2
    exit 1
  fi
  if ! python3 - "$play_key" <<'PY'
import json
import pathlib
import sys

path = pathlib.Path(sys.argv[1])
try:
    data = json.loads(path.read_text())
except Exception:
    sys.stderr.write("oslynstudio/play-store-key is not JSON.\n")
    sys.exit(1)
if not isinstance(data, dict) or not data.get("private_key") or not data.get("client_email"):
    sys.stderr.write(
        "oslynstudio/play-store-key is not a Google service account JSON (expected private_key and client_email).\n"
    )
    sys.exit(1)
path.chmod(0o600)
PY
  then
    rm -f "$play_key"
    exit 1
  fi
  chmod 600 "$play_key"
  echo "Saved Play service account key to android/fastlane/play-store-key.json"
else
  rm -f "$play_key"
  if grep -q 'ResourceNotFoundException' "$err"; then
    echo "Play service account JSON is not in Secrets Manager yet (oslynstudio/play-store-key)." >&2
    echo "The upload keystore is ready. Create the app in Play Console, enroll in Play App Signing, upload the first AAB manually to Internal testing, then store the service account JSON as that secret. See docs/android-release.md." >&2
  else
    echo "Could not fetch oslynstudio/play-store-key. Check AWS credentials (e.g. aws sso login / aws configure for profile a1, account 006033392195)." >&2
    cat "$err" >&2
    exit 1
  fi
fi
