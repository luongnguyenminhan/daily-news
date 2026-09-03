# Coding Guidelines

## Formatting

Always write readable, properly formatted code.

- Never put multiple statements on the same line.
- Use one statement per line.
- Properly indent TypeScript and TSX.
- Break long JSX elements into multiple lines.
- Put JSX props on separate lines when the element becomes long.
- Break long function bodies into readable blocks.
- Add blank lines between logical sections of a component.
- Do not minify or compress generated code.

Example:

Bad:

const [query, setQuery] = useState(""); const [loading, setLoading] = useState(false);

Good:

const [query, setQuery] = useState("");
const [loading, setLoading] = useState(false);

## Formatter

After modifying code, run:

npm run format

Use the project's Prettier configuration.