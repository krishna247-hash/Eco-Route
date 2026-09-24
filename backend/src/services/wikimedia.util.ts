const WIKIMEDIA_COMMONS_FILE_PREFIX = "File:";

/** Turns an OSM `wikimedia_commons=File:...` tag into a real, directly
 * loadable photo URL via Commons' Special:FilePath redirect -- no extra
 * API call or lookup needed. Category: tags and anything else are left
 * alone (never guessed at) since there's no single photo to point to. */
export function wikimediaPhotoUrl(wikimediaCommonsTag: string | undefined): string | undefined {
  if (!wikimediaCommonsTag?.startsWith(WIKIMEDIA_COMMONS_FILE_PREFIX)) {
    return undefined;
  }
  const filename = wikimediaCommonsTag.slice(WIKIMEDIA_COMMONS_FILE_PREFIX.length);
  if (!filename) return undefined;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=800`;
}
