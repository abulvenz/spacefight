import m from "mithril";
import tagl from "tagl-mithril";
import fn from "./fn";

const {
  button,
  div,
  svg,
  rect,
  g,
  label,
  p,
  input,
  textarea,
  h1,
  text,
  hr,
  line
} = tagl(m);

const Options = Object.freeze({
  NOTHING: 0,
  TURN_LEFT: 1,
  TURN_RIGHT: 2,
  SHOOT: 3
});

const Player = color => {
  let x = Math.random() * innerWidth - 10;
  let y = Math.random() * innerHeight - 10;
  let angle = Math.random() * 360;
  let v = 10;

  const move = () => {
    x += v * Math.cos((angle / 180) * Math.PI);
    y += v * Math.sin((angle / 180) * Math.PI);
    x < 0 && (x += innerWidth);
    y < 0 && (y += innerHeight);
    x > innerWidth && (x -= innerWidth);
    y > innerHeight && (y -= innerHeight);
  };
  const shoot = opp => {
    let ex = Math.cos((angle / 180) * Math.PI);
    let ey = Math.sin((angle / 180) * Math.PI);
    let dx = opp.x() - x;
    let dy = opp.y() - y;
    let d = Math.sqrt(dx * dx + dy * dy);
    let s = (ex * dx + ey * dy) / Math.max(d, 1);
    line({x1:x+ex*v,y1:y+ey*v,x2:x+ex*1000,y2:y+ey*1000});
    if (s > 0.99) {
      opp.explode();
    }
  };
  const turnLeft = () => {
    angle += 5;
  };
  const turnRight = () => {
    angle -= 5;
  };

  let neutralize = () =>{return { x1: 0, y1: 0, x2: 0, y2: 0 }};

  let shot = neutralize();
  let line = ({ x1, y1, x2, y2 }) => (shot = { x1, y1, x2, y2 });

  return {
    color: () => color,
    x: () => x,
    y: () => y,
    explode: () => (v = 0),
    angle: () => angle,
    line: () => shot,
    next: (option, opp) => {
      neutralize();
      switch (option) {
        case Options.TURN_LEFT:
          turnLeft();
          break;
        case Options.TURN_RIGHT:
          turnRight();
          break;
        case Options.SHOOT:
          shoot(opp);
          break;
        case Options.NOTHING:
        default:
          break;
      }
      move();
    }
  };
};

let p1 = Player("#f233f3");
let p2 = Player("#109912");

let time = 0;
let step = 50;

let state = 0;

const PlayerView = vnode => {
  return {
    view(vnode) {
      let p = vnode.attrs.player;
      let l = p.line();
      return [g(
        { transform: `translate(${p.x()},${p.y()})rotate(${p.angle()})` },
        rect({
          x: -5,
          y: -5,
          width: 10,
          height: 10,
          fill: p.color(),
          stroke: p.color()
        }),        
      ),
        line({...l,style:"stroke:rgb(255,0,0);stroke-width:2",})
    ];
    }
  };
};

const PlayerData = () => {
  return {
    programText: "return ()=>Math.random()<.3?Options.SHOOT:Math.random<.5?Options.TURN_LEFT:Options.TURN_RIGHT",
    color: "green",
    name: ""
  };
};

const GameService = () => {
  let player1 = PlayerData();
  let player2 = PlayerData();
  let started = false;
  return {
    player1,
    player2,
    started: () => started,
    evaluate() {
      player1.f = new Function("Options", player1.programText)(Options);
      player2.f = new Function("Options", player2.programText)(Options);
    },
    run() {
      started = true;
      setTimeout(() => {
        time += step;
        p1.next(player1.f(p1, p2, Options), p2);
        p2.next(player2.f(p2, p1, Options), p1);
        if (time > 15000) {
          started = false;
          time = 0;
        } else game.run();
        m.redraw();
      }, step);
    }
  };
};

const GameView = () => {
  return {
    view(vnode) {
      return div(
        { onkeypressed: console.log },
        svg(
          { width: innerWidth - 10, height: innerHeight - 10 },
          m(PlayerView, { player: p1 }),
          m(PlayerView, { player: p2 }),
          text({ x: 10, y: 10, stroke: "black" }, "state: " + state)
        )
      );
    }
  };
};

const PlayerInput = () => {
  return {
    view(vnode) {
      let p = vnode.attrs.player;
      return div.playerSetup(
        label("Name Player"),
        input({
          oninput: m.withAttr("value", v => (p.name = v)),
          value: p.name
        }),
        textarea({
          oninput: m.withAttr("value", v => (p.programText = v)),
          value: p.programText
        })
      );
    }
  };
};

const StartView = () => {
  return {
    view(vnode) {
      return [
        h1(
          "SpaceFight",
          m.trust("&nbsp;"),
          button.fancy(
            {
              onclick: () => {
                game.evaluate();
                game.run();
              }
            },
            "START"
          )
        ),
        hr(),
        m(PlayerInput, { player: game.player1 }),
        m(PlayerInput, { player: game.player2 }),
        p(
          "You can use the following functions: where p is the player object p.x() p.y() p.v() p.angle(), the opponent's object o has the same interface. Your function must return Options.NOTHING, Options.TURN_LEFT, Options.TURN_RIGHT or Options.SHOOT "
        )
      ];
    }
  };
};

let game = GameService();

m.mount(document.body, {
  view(vnode) {
    return game.started() ? m(GameView) : m(StartView);
  }
});
