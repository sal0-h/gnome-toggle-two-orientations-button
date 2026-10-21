.PHONY: check pack

check:
	node --test tests/*.test.js
	@for source in toggle-two-orientations@sal0-h/*.js; do node --check "$$source" || exit; done
	glib-compile-schemas --strict --dry-run toggle-two-orientations@sal0-h/schemas

pack: check
	python3 scripts/package.py
