[meta:type]: <> (blog)
[meta:tagsArr]: <> (video,misc,professional,software,2d,art)
[meta:isComments]: <> (false)
[meta:ispublished]: <> (true)
[meta:posterimg]: <> (support/ringed.png)

★ making waves
===============
`✑ bumblehead`
_⌚ 2010.06.04-20:06:00_

 * [![hand][10]][11]
 * [![hand][12]][13]
 * [![hand][14]][15]
 * [![hand][16]][17]

I finished a sinewave animation and [there's a demonstration page][0] that displays various sinewave videos made during production. The results are surprisingly dynamic.… The fun part of this project involved writing a Common Lisp program for generating the sinewaves and this required a few things in addition to writing a sinewave function. There are functions for drawing circles and connecting lines. There's a class for generating exponential curves...

It'll be appearing in a video.
_Something To Come Undone_, dir. Anna Chiaretta Lavatelli, 2010

Here are two tiny code pieces from sinewave.lisp. 'Live on, Common Lisp!

```lisp
(defmethod  coords-to-canvas (coords rgba (canvas image-canvas))
  (mapcar #'(lambda (xy)
              (pixel-to-canvas xy rgba canvas))
          coords))
(defmacro when-inside (frame bgn end &body body)
  `(when (and (>= ,frame ,bgn)
              (<= ,frame ,end))
     ,@body)) 
```

[0]: /doc/sinewave_demo/ "sinewave demo"
[10]: support/img/sine-evolution.jpg
[11]: support/img/full/sine-evolution.jpg
[12]: support/img/render.jpg
[13]: support/img/full/zrender.jpg
[14]: support/img/emacs-screenshot.jpg
[15]: support/img/full/emacs-screenshot.jpg
[16]: support/img/testing.jpg
[17]: support/img/full/testing.jpg
