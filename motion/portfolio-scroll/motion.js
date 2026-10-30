/* 포트폴리오 스크롤 모션판.
   1) 작업 카드·상세 창은 모션과 무관하게 항상 그린다.
   2) GSAP 이 있고 움직임 줄이기 설정이 꺼져 있을 때만 html.motion 을 붙이고 장면을 건다.
   3) 배경의 기억 그래프는 같은 점들이 장면마다 다른 모양으로 다시 모인다. */
(function () {
    'use strict';

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;
    var motion = !!(gsap && ST) && !reduce;

    /* ===== 작업 카드 ===== */
    var CAT = { agent: '에이전트 운영', work: '기업 AI', project: '개인 프로젝트', edu: '부트캠프' };
    var STATUS = { active: '운영 중', completed: '완료', archived: '보관', closed: '중단' };
    var LINK_ICON = { github: 'fab fa-github', external: 'fas fa-arrow-up-right-from-square', pdf: 'fas fa-file-pdf', colab: 'fas fa-play-circle', blog: 'fas fa-pen-nib', case: 'fas fa-folder-open' };
    var byId = {};

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderCards() {
        var track = document.getElementById('track');
        var html = '';
        var last = '';
        var n = 0;
        (window.PROJECTS || []).forEach(function (p) {
            byId[p.id] = p;
            var t = p.ko;
            if (p.category !== last) {
                last = p.category;
                n += 1;
                html += '<div class="divider mono" data-cat="' + p.category + '">0' + n + '<b>' + CAT[p.category] + '</b></div>';
            }
            var tags = (p.tags || []).slice(0, 3).map(function (g) { return '<span>' + esc(g) + '</span>'; }).join('');
            html += '<button type="button" class="pcard" id="p-' + p.id + '" data-id="' + p.id + '" data-cat="' + p.category + '" aria-haspopup="dialog">' +
                '<span class="ic"><i class="fas ' + (p.resultIcon || 'fa-cube') + '"></i></span>' +
                '<span class="st mono ' + p.status + '">' + (STATUS[p.status] || p.status) + '</span>' +
                '<span class="h3">' + esc(t.title) + '</span>' +
                '<span class="sb mono">' + esc(t.subtitle) + '</span>' +
                '<span class="sm">' + esc(t.summary || t.desc) + '</span>' +
                '<span class="tg">' + tags + '</span>' +
                '<span class="more">자세히 <i class="fas fa-arrow-right"></i></span>' +
                '</button>';
        });
        track.innerHTML = html;
    }

    var dlg = document.getElementById('dlg');
    function openProject(id) {
        var p = byId[id];
        if (!p) return;
        var t = p.ko;
        var bullets = (t.bullets || []).map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
        var tags = (p.tags || []).map(function (g) { return '<span>' + esc(g) + '</span>'; }).join('');
        var links = (p.links || []).map(function (lk) {
            var label = lk.label && typeof lk.label === 'object' ? (lk.label.ko || lk.label.en) : (lk.label || '보기');
            return '<a href="' + esc(lk.href) + '" target="_blank" rel="noopener noreferrer"><i class="' + (LINK_ICON[lk.kind] || 'fas fa-link') + '"></i>' + esc(label) + '</a>';
        }).join('');
        dlg.querySelector('.dlg-body').innerHTML =
            '<p class="eyebrow mono"><span>' + (STATUS[p.status] || p.status) + '</span><span>' + esc(t.subtitle) + '</span></p>' +
            '<h2 id="dlg-title">' + esc(t.title) + '</h2>' +
            '<p class="desc">' + esc(t.desc) + '</p>' +
            (bullets ? '<ul>' + bullets + '</ul>' : '') +
            '<div class="tg">' + tags + '</div>' +
            (t.result ? '<p class="result"><i class="fas ' + (p.resultIcon || 'fa-check-circle') + '"></i><b>결과</b> ' + esc(t.result) + '</p>' : '') +
            (links ? '<div class="links">' + links + '</div>' : '');
        if (!dlg.open) dlg.showModal();
        dlg.scrollTop = 0;
        if (motion) {
            gsap.fromTo(dlg, { y: 40, scale: .96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: .45, ease: 'power3.out' });
            gsap.from(dlg.querySelectorAll('.dlg-body > *'), { y: 16, autoAlpha: 0, duration: .4, stagger: .04, delay: .08, ease: 'power2.out' });
        }
    }

    renderCards();
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.pcard');
        if (card) { openProject(card.dataset.id); return; }
        var chip = e.target.closest('a.chip');
        if (chip) { e.preventDefault(); openProject(chip.getAttribute('href').slice(3)); }
    });
    dlg.querySelector('.close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    if (/^#p-/.test(location.hash)) openProject(location.hash.slice(3));

    /* 메뉴 앵커는 고정 장면의 여백까지 포함한 실제 위치로 부드럽게 보낸다 */
    document.querySelectorAll('a[href^="#"]:not(.chip)').forEach(function (a) {
        a.addEventListener('click', function (e) {
            var el = document.querySelector(a.getAttribute('href'));
            if (!el) return;
            e.preventDefault();
            window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: reduce ? 'auto' : 'smooth' });
        });
    });

    var scenes = Array.prototype.slice.call(document.querySelectorAll('[data-scene]'));
    startGraph();

    if (!motion) return;

    /* ===== 이하 모션 ===== */
    document.documentElement.classList.add('motion');
    gsap.registerPlugin(ST);

    function splitWords(el, wrapInner) {
        var words = el.textContent.trim().split(/\s+/);
        el.setAttribute('aria-label', el.textContent.trim());
        el.innerHTML = words.map(function (w) {
            return wrapInner ? '<span class="w" aria-hidden="true"><span>' + esc(w) + '</span></span>' : '<span class="w" aria-hidden="true">' + esc(w) + '</span>';
        }).join(' ');
        return el.querySelectorAll(wrapInner ? '.w > span' : '.w');
    }

    var SCRAMBLE = '01#%&*<>/=+$';
    function scramble(el, dur) {
        var final = el.dataset.text || el.textContent;
        el.dataset.text = final;
        var o = { p: 0 };
        gsap.to(o, {
            p: 1, duration: dur || .8, ease: 'none',
            onUpdate: function () {
                var k = Math.floor(o.p * final.length);
                var s = final.slice(0, k);
                for (var i = k; i < final.length; i++) s += final[i] === ' ' ? ' ' : SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0];
                el.textContent = s;
            },
            onComplete: function () { el.textContent = final; }
        });
    }

    /* --- 히어로: 들어올 때 한 번 --- */
    gsap.timeline({ delay: .15, defaults: { ease: 'power3.out' } })
        .from('.top', { y: -30, autoAlpha: 0, duration: .8 })
        .from('.badge', { y: 18, autoAlpha: 0, duration: .6, stagger: .1 }, '<.1')
        .from('.name .ch', { yPercent: 110, rotate: 10, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: .09 }, '<.1')
        .from('.handle', { y: 10, autoAlpha: 0, duration: .6 }, '-=.7')
        .from('.role', { x: -24, autoAlpha: 0, duration: .6 }, '<.1')
        .from('.lead .ln > span', { yPercent: 105, duration: .9, stagger: .08 }, '<')
        .from('.cta > *', { y: 16, autoAlpha: 0, duration: .6, stagger: .08 }, '-=.5')
        .from('.cue', { autoAlpha: 0, duration: .6 }, '-=.3');

    /* 히어로가 빠져나갈 때: 이름은 벌어지며 커지고 나머지는 먼저 떠난다 */
    var heroOut = { trigger: '.hero', start: 'top top', end: 'bottom 15%', scrub: true };
    gsap.fromTo('.hero-inner', { yPercent: 0, autoAlpha: 1 }, { yPercent: -22, autoAlpha: 0, ease: 'none', scrollTrigger: heroOut });
    gsap.fromTo('.name', { scale: 1, letterSpacing: '-0.05em' }, { scale: 1.12, letterSpacing: '0.06em', transformOrigin: '0% 100%', ease: 'none', scrollTrigger: heroOut });

    /* --- 섹션 머리 공통: 라벨은 글자 흩어졌다 맞춰지고, 제목은 단어가 아래서 올라온다 --- */
    document.querySelectorAll('.label').forEach(function (el) {
        ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { scramble(el, .7); } });
    });
    document.querySelectorAll('.split-up').forEach(function (el) {
        var w = splitWords(el, true);
        gsap.from(w, { yPercent: 115, rotate: 4, duration: 1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    document.querySelectorAll('section .sub').forEach(function (el) {
        gsap.from(el, { y: 24, autoAlpha: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    /* 터미널: 진행률(0~1)만큼 위에서부터 글자를 친다 */
    var termSpans = Array.prototype.slice.call(document.querySelectorAll('.terminal .t'));
    var termTotal = termSpans.reduce(function (s, el) { return s + el.dataset.text.length; }, 0);
    function typeTerminal(p) {
        var left = Math.round(p * termTotal);
        termSpans.forEach(function (el) {
            var full = el.dataset.text;
            var k = Math.max(0, Math.min(full.length, left));
            left -= full.length;
            el.textContent = full.slice(0, k);
            el.parentNode.style.visibility = k > 0 ? 'visible' : 'hidden';
        });
    }

    var kineticWords = splitWords(document.querySelector('.kinetic'), false);
    var aboutPs = document.querySelectorAll('.about-body p');

    var mm = gsap.matchMedia();
    mm.add({
        wide: '(min-width: 900px) and (min-height: 640px)',
        narrow: '(max-width: 899px), (max-height: 639px)'
    }, function (ctx) {
        var wide = ctx.conditions.wide;
        var projects = document.querySelector('.projects');
        var blog = document.querySelector('.blog');
        var track = document.getElementById('track');
        var unskew = null;

        /* --- 소개 --- */
        if (wide) {
            /* 제목 단어가 차례로 켜지고, 제목이 올라가며 본문·터미널이 이어서 켜진다 */
            gsap.set(kineticWords, { opacity: .14 });
            gsap.set(aboutPs, { opacity: .18 });
            typeTerminal(0);
            var tl = gsap.timeline({ scrollTrigger: { trigger: '.about-pin', start: 'top 12%', end: '+=220%', pin: true, scrub: .6 } });
            tl.to(kineticWords, { opacity: 1, stagger: .12, duration: .3, ease: 'none' })
                .from('.about-grid', { y: 80, autoAlpha: 0, duration: .8 }, '-=.2');
            aboutPs.forEach(function (p, i) {
                tl.to(p, { opacity: 1, duration: .4 }, i === 0 ? '<.3' : '>');
                if (i > 0) tl.to(aboutPs[i - 1], { opacity: .5, duration: .4 }, '<');
            });
            var term = { p: 0 };
            tl.to(term, { p: 1, duration: tl.duration() - 1, ease: 'none', onUpdate: function () { typeTerminal(term.p); } }, 1)
                .to(aboutPs, { opacity: 1, duration: .3 })
                .from('.focus .tag', { y: 20, autoAlpha: 0, scale: .8, stagger: .06, duration: .3 }, '<');
        } else {
            gsap.fromTo(kineticWords, { opacity: .14 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: '.kinetic', start: 'top 80%', end: 'bottom 45%', scrub: true } });
            gsap.from(aboutPs, { y: 30, autoAlpha: 0, duration: .8, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.about-body', start: 'top 82%' } });
            var tp = { p: 0 };
            typeTerminal(0);
            gsap.to(tp, { p: 1, duration: 2.4, ease: 'none', onUpdate: function () { typeTerminal(tp.p); }, scrollTrigger: { trigger: '.terminal', start: 'top 80%' } });
            gsap.from('.focus .tag', { y: 16, autoAlpha: 0, stagger: .05, duration: .5, scrollTrigger: { trigger: '.focus', start: 'top 90%' } });
        }

        /* --- 작업: 넓은 화면은 세로 스크롤로 가로 트랙을 민다 --- */
        if (wide) {
            projects.classList.add('is-h');
            var dist = function () { return track.scrollWidth - window.innerWidth; };
            var bar = document.querySelector('.proj-bar i');
            var slide = gsap.to(track, {
                x: function () { return -dist(); }, ease: 'none',
                scrollTrigger: {
                    trigger: '.proj-pin', pin: true, start: 'top top', end: function () { return '+=' + dist(); },
                    scrub: .6, invalidateOnRefresh: true,
                    onUpdate: function (self) {
                        gsap.set(bar, { scaleX: self.progress });
                        var v = gsap.utils.clamp(-5, 5, self.getVelocity() / -300);
                        gsap.to(track, { skewX: v, duration: .5, ease: 'power3.out', overwrite: 'auto' });
                    }
                }
            });
            track.querySelectorAll('.pcard').forEach(function (c) {
                gsap.from(c, { y: 90, rotate: 4, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: slide, start: 'left 100%', end: 'left 72%', scrub: true } });
            });
            // 스크롤이 멈추면 기울기를 푼다
            unskew = function () { gsap.to(track, { skewX: 0, duration: .6, ease: 'power3.out', overwrite: 'auto' }); };
            ST.addEventListener('scrollEnd', unskew);
            var chips = document.querySelectorAll('.chapters li');
            var setChapter = function (cat) { chips.forEach(function (li) { li.classList.toggle('on', li.dataset.cat === cat); }); };
            setChapter('agent');
            var divs = track.querySelectorAll('.divider');
            divs.forEach(function (d, i) {
                gsap.from(d.querySelector('b'), { xPercent: 40, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: d, containerAnimation: slide, start: 'left 95%', end: 'left 60%', scrub: true } });
                ST.create({
                    trigger: d, containerAnimation: slide, start: 'left 55%',
                    onEnter: function () { setChapter(d.dataset.cat); },
                    onLeaveBack: function () { setChapter(i ? divs[i - 1].dataset.cat : 'agent'); }
                });
            });
        } else {
            gsap.set(track.querySelectorAll('.pcard, .divider'), { y: 40, autoAlpha: 0 });
            ST.batch(track.querySelectorAll('.pcard, .divider'), {
                start: 'top 90%', once: true,
                onEnter: function (b) { gsap.to(b, { y: 0, autoAlpha: 1, duration: .7, ease: 'power3.out', stagger: .08 }); }
            });
        }

        /* --- 판단 기록: 넓은 화면은 판정문을 한 장씩 넘기는 릴 --- */
        var vs = Array.prototype.slice.call(document.querySelectorAll('.verdict'));
        if (wide) {
            blog.classList.add('is-stack');
            var count = document.querySelector('.reel-count b');
            var shown = -1;
            gsap.set(vs, { autoAlpha: 0 });
            var rt = gsap.timeline({
                scrollTrigger: {
                    trigger: '.blog-pin', pin: true, start: 'top top', end: '+=' + vs.length * 75 + '%', scrub: .5,
                    onUpdate: function (self) {
                        var i = Math.min(vs.length - 1, Math.floor(self.progress * vs.length));
                        if (i !== shown) {
                            shown = i;
                            count.textContent = (i < 9 ? '0' : '') + (i + 1);
                            scramble(vs[i].querySelector('.big'), .5);
                        }
                    }
                }
            });
            vs.forEach(function (v, i) {
                var at = 'v' + i;
                rt.addLabel(at);
                if (i > 0) rt.to(vs[i - 1], { autoAlpha: 0, yPercent: -18, scale: .92, rotateX: 18, duration: 1 }, at);
                rt.fromTo(v, { autoAlpha: 0, yPercent: 24, rotateX: -24, scale: 1 }, { autoAlpha: 1, yPercent: 0, rotateX: 0, duration: 1 }, at)
                    .from(v.querySelector('.big'), { yPercent: 50, skewY: 6, duration: 1 }, at)
                    .from(v.querySelector('.kind'), { scale: 2.6, rotate: -40, autoAlpha: 0, duration: .5, ease: 'back.out(3)' }, at + '+=.5')
                    .from([v.querySelector('.vt'), v.querySelector('.vs')], { y: 24, autoAlpha: 0, stagger: .15, duration: .6 }, at + '+=.4')
                    .to({}, { duration: .8 });
            });
        } else {
            vs.forEach(function (v) {
                gsap.from(v, {
                    y: 40, autoAlpha: 0, duration: .8, ease: 'power3.out',
                    scrollTrigger: { trigger: v, start: 'top 88%', onEnter: function () { scramble(v.querySelector('.big'), .6); } }
                });
            });
        }

        return function () {
            if (unskew) ST.removeEventListener('scrollEnd', unskew);
            projects.classList.remove('is-h');
            blog.classList.remove('is-stack');
            gsap.set(track, { clearProps: 'all' });
        };
    });

    /* --- 경력: 연도가 거꾸로 세어지고 타임라인이 그려진다 --- */
    gsap.to('.spine i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 55%', end: 'bottom 55%', scrub: .4 } });
    var digits = document.querySelector('.year .digits');
    var yearNow = { v: 2026 };
    function setYear(y) {
        gsap.to(yearNow, {
            v: y, duration: Math.min(1.4, .4 + Math.abs(yearNow.v - y) * .12), ease: 'power2.inOut', overwrite: true,
            onUpdate: function () { digits.textContent = Math.round(yearNow.v); }
        });
        gsap.fromTo(digits, { skewX: -12 }, { skewX: 0, duration: .6, ease: 'power3.out' });
    }
    document.querySelectorAll('.timeline .item').forEach(function (item) {
        var y = +item.dataset.year;
        ST.create({
            trigger: item, start: 'top 55%', end: 'bottom 55%',
            onEnter: function () { setYear(y); }, onEnterBack: function () { setYear(y); }
        });
        gsap.from(item.querySelector('.marker'), { scale: 0, rotate: -120, duration: .7, ease: 'back.out(2.2)', scrollTrigger: { trigger: item, start: 'top 78%' } });
        var parts = item.querySelectorAll('.content > :not(.evidence), .evidence > .k');
        gsap.from(parts, { x: 40, autoAlpha: 0, duration: .8, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 78%' } });
        item.querySelectorAll('.evidence figure').forEach(function (f, i) {
            var tl = gsap.timeline({ scrollTrigger: { trigger: f, start: 'top 85%' } });
            tl.fromTo(f, { clipPath: 'inset(0 0 100% 0 round 12px)' }, { clipPath: 'inset(0 0 0% 0 round 12px)', duration: 1.1, delay: i * .12, ease: 'expo.inOut' })
                .from(f.querySelector('img'), { scale: 1.3, duration: 1.4, ease: 'expo.out' }, '<.2');
        });
    });
    gsap.from('.edu', { autoAlpha: 0, y: 20, duration: .8, scrollTrigger: { trigger: '.edu', start: 'top 92%' } });

    /* 블로그 아래 줄 */
    gsap.from('.rows .row', { y: 24, autoAlpha: 0, duration: .7, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.rows', start: 'top 85%' } });

    /* --- 기술: 이름은 해독되듯, 항목은 차례로, 밑줄은 그어진다 --- */
    document.querySelectorAll('.sr').forEach(function (row) {
        var td = row.querySelector('.td');
        var items = td.textContent.split(' · ');
        td.innerHTML = items.map(function (s) { return '<span class="it">' + esc(s) + '</span>'; }).join(' · ');
        gsap.set(row, { '--l': 0 });
        var tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%' } });
        tl.to(row, { '--l': 1, duration: 1, ease: 'expo.inOut' })
            .add(function () { scramble(row.querySelector('.th'), .6); }, 0)
            .from(td.querySelectorAll('.it'), { y: 14, autoAlpha: 0, stagger: .05, duration: .5, ease: 'power2.out' }, .15);
    });

    /* --- 연락처: 메일 주소 글자가 튀어 오른다 --- */
    var email = document.querySelector('.email');
    email.innerHTML = email.textContent.split('').map(function (c) { return '<span class="c" aria-hidden="true">' + esc(c) + '</span>'; }).join('');
    var ec = email.querySelectorAll('.c');
    gsap.from(ec, { yPercent: 120, rotate: 20, autoAlpha: 0, duration: .9, ease: 'back.out(2)', stagger: .035, scrollTrigger: { trigger: email, start: 'top 88%' } });
    email.addEventListener('mouseenter', function () {
        gsap.to(ec, { y: -10, duration: .18, ease: 'power2.out', stagger: { each: .025, yoyo: true, repeat: 1 }, overwrite: 'auto' });
    });
    gsap.from('.contact .card', { y: 40, autoAlpha: 0, duration: .8, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.cards', start: 'top 92%' } });

    /* --- 전역: 진행 막대·메뉴 표시·장면 표지 --- */
    gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });
    var tagNum = document.querySelector('.scene-tag b');
    var tagName = document.querySelector('.scene-tag span');
    scenes.forEach(function (sec, i) {
        ST.create({
            trigger: sec, start: 'top 50%', end: 'bottom 50%',
            onToggle: function (self) {
                if (!self.isActive) return;
                tagNum.textContent = '0' + i;
                tagName.textContent = sec.dataset.scene;
                document.querySelectorAll('.menu a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + sec.id); });
            }
        });
    });

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
    window.addEventListener('load', function () { ST.refresh(); });

    /* ===== 기억 그래프 ===== */
    function startGraph() {
        var cv = document.getElementById('graph');
        var ctx = cv.getContext('2d');
        var W = 0, H = 0, DPR = 1, nodes = [], edges = [], pulses = [];
        var mouse = { x: -9999, y: -9999 };
        var sceneF = 0;
        var ALPHA = [1, .55, .4, .5, .45, .45, .8];

        function rnd(seed) { var x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }

        function build() {
            var N = W < 700 ? 48 : 86;
            nodes = [];
            pulses = []; // 점 개수가 바뀌면 옛 연결을 가리키는 신호를 버린다
            for (var i = 0; i < N; i++) {
                nodes.push({ i: i, r: [rnd(i + 1), rnd(i + 101), rnd(i + 201), rnd(i + 301)], x: W / 2, y: H / 2, ox: 0, oy: 0, amber: rnd(i + 401) < .32, s: 1 + rnd(i + 501) * 1.8 });
            }
            // 연결은 첫 장면(흩어진 모양)에서 가장 가까운 둘로 고정한다 - 장면이 바뀌어도 같은 기억망
            edges = [];
            var p0 = nodes.map(function (n) { return layout(0, n, 0); });
            nodes.forEach(function (n, i) {
                var d = p0.map(function (p, j) { return { j: j, d: j === i ? 1e9 : Math.hypot(p.x - p0[i].x, p.y - p0[i].y) }; }).sort(function (a, b) { return a.d - b.d; });
                for (var k = 0; k < 2; k++) edges.push([Math.min(i, d[k].j), Math.max(i, d[k].j)]);
            });
            var seen = {};
            edges = edges.filter(function (e) { var key = e[0] + '-' + e[1]; if (seen[key]) return false; seen[key] = 1; return true; });
            nodes.forEach(function (n) { var p = layout(0, n, 0); n.x = p.x; n.y = p.y; });
        }

        function layout(s, n, t) {
            var r = n.r, N = nodes.length || 1, wide = W >= 900, a, R;
            switch (s) {
                case 0: // 흩어진 기억 (글자 쪽은 비워 둔다)
                    return { x: W * (wide ? .42 + .58 * r[0] : r[0]), y: H * (.06 + .88 * r[1]) };
                case 1: // 회전하는 기억 구
                    var th = r[0] * Math.PI * 2 + t * .12, ph = Math.acos(2 * r[1] - 1);
                    R = Math.min(W, H) * (wide ? .3 : .36);
                    var X = R * Math.sin(ph) * Math.cos(th), Z = R * Math.sin(ph) * Math.sin(th), Y = R * Math.cos(ph);
                    var k = 1 + Z / (R * 3.2);
                    return { x: (wide ? W * .74 : W * .5) + X * k, y: H * (wide ? .55 : .5) + Y * k, z: k };
                case 2: // 오른쪽 가장자리의 이중 나선 (시간의 축)
                    var yy = (n.i / N) * H * 1.15 - H * .07;
                    return { x: W - (wide ? 80 : 28) + Math.sin(n.i * .45 + t * .7) * (wide ? 44 : 16) * (n.i % 2 ? 1 : -1), y: yy };
                case 3: // 아래로 흐르는 띠
                    var fx = ((r[0] + t * .015) % 1) * W * 1.3 - W * .15;
                    return { x: fx, y: H * .9 + Math.sin(fx * .008 + t) * 22 + (r[1] - .5) * 46 };
                case 4: // 판정 격자
                    var cols = wide ? 12 : 6, rows = Math.ceil(N / cols);
                    return { x: ((n.i % cols) + .5) / cols * W, y: (Math.floor(n.i / cols) + .5) / rows * H };
                case 5: // 여섯 줄
                    return { x: r[0] * W, y: H * (.2 + (n.i % 6) * .12) + (r[1] - .5) * 14 };
                default: // 연락처를 둘러싸는 고리로 모인다
                    a = n.i / N * Math.PI * 2 + t * .25;
                    R = .85 + r[2] * .3;
                    return { x: W / 2 + Math.cos(a) * Math.min(W * .46, 560) * R, y: H * .5 + Math.sin(a) * Math.min(H * .3, 230) * R };
            }
        }

        function resize() {
            DPR = Math.min(2, window.devicePixelRatio || 1);
            W = window.innerWidth; H = window.innerHeight;
            cv.width = W * DPR; cv.height = H * DPR;
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            build();
        }

        function readScene() {
            var mid = H * .5, f = 0;
            for (var i = 0; i < scenes.length; i++) {
                var b = scenes[i].getBoundingClientRect();
                if (b.top <= mid) {
                    f = i + (b.bottom > mid ? Math.min(1, (mid - b.top) / Math.max(1, b.height)) * .999 : .999);
                }
            }
            // 장면의 앞 70%는 제 모양을 유지하고 끝 30%에서 다음 모양으로 넘어간다
            var base = Math.floor(f), frac = f - base;
            return base + Math.max(0, (frac - .7) / .3);
        }

        function ease(x) { return x * x * (3 - 2 * x); }

        function frame(now) {
            var t = now / 1000;
            var target = readScene();
            sceneF += (target - sceneF) * .08;
            var a = Math.min(6, Math.floor(sceneF)), b = Math.min(6, a + 1), k = ease(Math.min(1, sceneF - a));
            var alpha = ALPHA[a] + (ALPHA[b] - ALPHA[a]) * k;

            ctx.clearRect(0, 0, W, H);
            nodes.forEach(function (n) {
                var pa = layout(a, n, t), pb = layout(b, n, t);
                var tx = pa.x + (pb.x - pa.x) * k + Math.sin(t * .5 + n.r[2] * 6) * 7;
                var ty = pa.y + (pb.y - pa.y) * k + Math.cos(t * .4 + n.r[3] * 6) * 7;
                n.z = (pa.z || 1) + ((pb.z || 1) - (pa.z || 1)) * k;
                var dx = tx - mouse.x, dy = ty - mouse.y, d = Math.hypot(dx, dy);
                var push = d < 150 ? (150 - d) / 150 * 34 : 0;
                n.ox += ((d ? dx / d : 0) * push - n.ox) * .1;
                n.oy += ((d ? dy / d : 0) * push - n.oy) * .1;
                n.x += (tx + n.ox - n.x) * .09;
                n.y += (ty + n.oy - n.y) * .09;
            });

            ctx.lineWidth = 1;
            edges.forEach(function (e) {
                var p = nodes[e[0]], q = nodes[e[1]], d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d > 260) return;
                ctx.strokeStyle = 'rgba(230,169,92,' + (.22 * (1 - d / 260) * alpha).toFixed(3) + ')';
                ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            });
            if (mouse.x > 0) {
                nodes.forEach(function (n) {
                    var d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
                    if (d < 170) {
                        ctx.strokeStyle = 'rgba(244,192,120,' + (.35 * (1 - d / 170) * alpha).toFixed(3) + ')';
                        ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(n.x, n.y); ctx.stroke();
                    }
                });
            }
            nodes.forEach(function (n) {
                ctx.fillStyle = n.amber ? 'rgba(230,169,92,' + (.85 * alpha) + ')' : 'rgba(236,231,219,' + (.5 * alpha * n.z) + ')';
                ctx.beginPath(); ctx.arc(n.x, n.y, n.s * (n.z || 1), 0, Math.PI * 2); ctx.fill();
            });

            // 기억을 꺼내는 신호: 연결을 타고 빛이 지나간다
            if (pulses.length < 5 && Math.random() < .04 && edges.length) pulses.push({ e: edges[(Math.random() * edges.length) | 0], t0: t });
            pulses = pulses.filter(function (p) {
                var u = (t - p.t0) / 1.1;
                if (u >= 1) return false;
                var A = nodes[p.e[0]], B = nodes[p.e[1]];
                if (Math.hypot(A.x - B.x, A.y - B.y) > 260) return false;
                var x = A.x + (B.x - A.x) * u, y = A.y + (B.y - A.y) * u;
                var g = ctx.createRadialGradient(x, y, 0, x, y, 10);
                g.addColorStop(0, 'rgba(255,214,150,' + (.9 * alpha) + ')');
                g.addColorStop(1, 'rgba(255,214,150,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
                return true;
            });

            if (!reduce && !document.hidden) requestAnimationFrame(frame);
        }

        resize();
        window.addEventListener('resize', function () { resize(); if (reduce) frame(0); });
        if (reduce) { frame(0); return; }
        window.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { mouse.x = e.clientX; mouse.y = e.clientY; } });
        document.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
        document.addEventListener('visibilitychange', function () { if (!document.hidden) requestAnimationFrame(frame); });
        requestAnimationFrame(frame);
    }
})();
