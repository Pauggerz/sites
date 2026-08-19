// Shared handle to the muck board's <video> element. The board's video is the
// ONLY media element for bullshit-screen.mp4 — its audio track is the song.
// One element means picture and sound can never drift apart.
export const screenMedia = { el: null }
