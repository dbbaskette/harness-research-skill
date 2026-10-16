"""Verbatim readable text of an HTML page read from stdin: drops scripts, styles and markup, keeps the words.
Struck-through or deleted text (<s>, <strike>, <del>) is kept as ~~text~~ so it is never read as current;
the 0.9.1 trial copy of this tool dropped that markup."""
import sys, re
from html.parser import HTMLParser
STRUCK = {'s', 'strike', 'del'}
BLOCK = {'p','div','br','li','ul','ol','h1','h2','h3','h4','h5','h6','tr','table','pre','blockquote','dt','dd','dl','section','article','header','footer','hr','td','th'}
class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.out = []; self.skip = 0; self.pre = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'): self.skip += 1
        if tag == 'pre': self.pre += 1
        if tag in STRUCK: self.out.append('~~')
        if tag in BLOCK: self.out.append('\n')
        if tag in ('h1', 'h2', 'h3', 'h4'): self.out.append('#' * int(tag[1]) + ' ')
        if tag == 'li': self.out.append('- ')
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript') and self.skip: self.skip -= 1
        if tag == 'pre' and self.pre: self.pre -= 1
        if tag in STRUCK: self.out.append('~~')
        if tag in BLOCK: self.out.append('\n')
    def handle_data(self, data):
        if not self.skip: self.out.append(data if self.pre else re.sub(r'\s+', ' ', data))
p = Text(); p.feed(sys.stdin.read())
text = '\n'.join(line.strip() for line in ''.join(p.out).split('\n'))
text = re.sub(r'\n{3,}', '\n\n', text)
sys.stdout.write(text.strip() + '\n')
