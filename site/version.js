// The commit this page was deployed from, and nothing else.
//
// WHY IT IS A FILE OF ITS OWN. A feedback report has to be able to say what code the reporter
// was looking at. It used to carry a seven character digest of the drawing under the name
// "build", which reads as an abbreviated commit and is not one: it moved only when the layout
// was regenerated, so every change that touched app.js, feedback.js or the stylesheet left it
// untouched while the site changed underneath it, and looking the value up failed with "not a
// valid object name". Issue 47.
//
// The value therefore has to be written where the deploy happens rather than where the drawing
// is built, and it cannot go into a generated document: site/instance.js and site/layout.js
// have to stay byte for byte what build/build_layout.py reproduces, and a deploy-time edit to
// either would end that. So it is here,
// in the one file in site/ whose deployed bytes are deliberately not the bytes in the tree.
//
// .github/workflows/pages.yml rewrites this file into the artifact it publishes, with the sha it
// checked out and the moment it published it, and then reads the stamp back off the origin and
// fails the job if it does not name that sha.
//
// THE COPY IN THE REPOSITORY NAMES NO COMMIT, on purpose. A working tree, a page opened from
// disk and a local web server are not deployments and there is no commit they can honestly
// claim: the files may be edited, staged, or newer than anything pushed. `commit: null` is the
// truthful answer, and feedback.js prints a sentence saying so rather than a blank or a
// plausible looking value.
window.ZV = { commit: null, deployedAt: null, source: 'working tree, not a deployment' };
