"""Generates simple sprout PNG icons for the extension without any dependencies."""
import struct, zlib, os, math

def png(size, path):
    px = []
    for y in range(size):
        row = b"\x00"
        for x in range(size):
            u, v = (x + .5) / size, (y + .5) / size
            r = math.hypot(u - .5, v - .5)
            col = (0, 0, 0, 0)
            if r < .48: col = (244, 241, 232, 255)                      # background disc
            if abs(u - .5) < .05 and .45 < v < .82: col = (63, 143, 79, 255)  # stem
            for cx, cy in ((.34, .42), (.66, .36)):                       # leaves
                dx, dy = (u - cx) / .17, (v - cy) / .09
                if dx * dx + dy * dy < 1: col = (95, 179, 106, 255)
            if .3 < u < .7 and abs(v - .82) < .04: col = (138, 90, 59, 255)  # soil
            row += bytes(col)
        px.append(row)
    raw = zlib.compress(b"".join(px), 9)
    chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")
    open(path, "wb").write(data)

out = os.path.join(os.path.dirname(__file__), "..", "extension", "icons")
os.makedirs(out, exist_ok=True)
for s in (16, 48, 128):
    png(s, os.path.join(out, f"{s}.png"))
print("icons written")
