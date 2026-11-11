#!/usr/bin/env bash
# Static checks that do not need the engine: GDScript parse + gdlint (gdtoolkit 4.x).
#   pip install gdtoolkit==4.*   then   tools/lint.sh
set -euo pipefail
cd "$(dirname "$0")/.."
GDPARSE="${GDPARSE:-gdparse}"
GDLINT="${GDLINT:-gdlint}"
status=0
while IFS= read -r -d '' file; do
	if ! "$GDPARSE" "$file" >/dev/null 2>&1; then
		echo "PARSE FAIL: $file"
		status=1
	fi
done < <(find src tests -name "*.gd" -print0)
"$GDLINT" src tests || status=1
exit $status
