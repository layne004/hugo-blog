document.addEventListener("DOMContentLoaded", function () {

    console.log("particles start");

    particlesJS("particles-js", {
	  particles: {
		// 粒子数量
		number: {
		  value: 200,
		  density: {
			enable: true,
			value_area: 1000
		  }
		},
		color: {
		  value: "#000000"
		},
		shape: {
		  type: "circle"
		},
		opacity: {
		  value: 0.7,
		},
		// 大小
		size: {
		  value: 2,
		  random: true,
		  anim: {
			enable: true,
			speed: 1,
			size_min: 0.3,
			sync: false
		  }
		},
		line_linked: {
		  enable: false
		},
		// 移动
		move: {
		  enable: true,

		  // 向上漂浮
		  direction: "top",

		  // 随机漂动
		  random: true,

		  // 不直线
		  straight: false,

		  // 慢速
		  speed: 0.8,

		  // 出界继续生成
		  out_mode: "out",

		  bounce: false
		}
	  
	  },

	  interactivity: {
		events: {
		  onhover: {
			enable: false
		  }
		}
	  },

	  retina_detect: true
	});

});