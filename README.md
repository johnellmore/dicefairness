# Dice fairness tester

_Try it out at [dicefairness.johnellmore.com](https://dicefairness.johnellmore.com/)._

This is a simple-to-use dice fairness assessment for standard gaming dice. If you have a die that seems to be remarkably lucky or remarkably terrible, you can pop this open and enter a bunch of die rolls to get an assessment.

The interface uses a naive guessing algorithm to figure out what kind of die you're rolling. Then, using the number of sides on that die, performs a [Pearson's chi-squared test](https://en.wikipedia.org/wiki/Pearson's_chi-squared_test). This doesn't give a perfect answer, and the interface doesn't claim that, either; you could always have an lucky or unlucky string of rolls. The guidance on the interface tries to explain that reasonably clearly.

## Local development

There's no fancy `npm` or `yarn` package installation or local dev environment
here. The single dependency (jstat) is just included in the repo.

If you want to spin up a local server for development, python's one-line HTTP server is perfect. From the repo's root:

```
python3 -m http.server 8000 --bind 127.0.0.1
```

You can then access the project at [http://127.0.0.1:8000](http://127.0.0.1:8000)

## Tests

Some simple unit tests are defined in `test.mjs`. To run them:

```
node tests.mjs
```

Use a version of Node.js at least 14.x or later. It might work in earlier versions of Node, but I forget what the support is for ES modules and other language features is in earlier versions offhand.