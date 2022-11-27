const wait = (t) => new Promise((s) => setTimeout(s, t, t));

module.exports = {
  wait
}
