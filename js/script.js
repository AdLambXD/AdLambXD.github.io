/******************************************************************************************************************************
Waypoints
*******************************************************************************************************************************/ 

$(document).ready(function() {

	$('.wp1').waypoint(function() {
		$('.wp1').addClass('animated fadeInLeft');
	}, {
		offset: '75%'
	});
	$('.wp2').waypoint(function() {
		$('.wp2').addClass('animated fadeInUp');
	}, {
		offset: '75%'
	});
	$('.wp3').waypoint(function() {
		$('.wp3').addClass('animated fadeInDown');
	}, {
		offset: '55%'
	});
	$('.wp4').waypoint(function() {
		$('.wp4').addClass('animated fadeInDown');
	}, {
		offset: '75%'
	});
	$('.wp5').waypoint(function() {
		$('.wp5').addClass('animated fadeInUp');
	}, {
		offset: '75%'
	});
	$('.wp6').waypoint(function() {
		$('.wp6').addClass('animated fadeInDown');
	}, {
		offset: '75%'
	});

});

/******************************************************************************************************************************
Nav Button
*******************************************************************************************************************************/ 

$(window).load(function() {

	$('.nav_slide_button').click(function() {
		$('.pull').slideToggle();
	});

});

document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('open-button');
    const menuWrap = document.querySelector('.menu-wrap');

    // 确保元素存在后再添加事件监听器
    if (menuButton && menuWrap) {
        menuButton.addEventListener('click', function() {
            menuWrap.classList.toggle('active');
        });
    }
});

$(function() {

	$('a[href*=#]:not([href=#])').click(function() {
		if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && location.hostname === this.hostname) {

			var target = $(this.hash);
			target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
			if (target.length) {
				$('html,body').animate({
					scrollTop: target.offset().top - 125
				}, 1000);
				return false;
			}
		}
	});

});

/******************************************************************************************************************************
Nav Transform
*******************************************************************************************************************************/ 

// 修改：确保元素存在后再添加事件监听器
const navToggle = document.querySelector("#nav-toggle");
if (navToggle) {
    navToggle.addEventListener("click", function() {
        this.classList.toggle("active");
    });
}

/******************************************************************************************************************************
Flexsliders
*******************************************************************************************************************************/ 

$(window).load(function() {
    // 检查 #blogSlider 是否存在
    if ($('#blogSlider').length) {
        $('#blogSlider').flexslider({
            animation: "slide",
            directionNav: false,
            controlNav: true,
            touch: false,
            pauseOnHover: true,
            start: function() {
                $.waypoints('refresh');
            }
        });
    }

    // 检查 #servicesSlider 是否存在
    if ($('#servicesSlider').length) {
        $('#servicesSlider').flexslider({
            animation: "slide",
            directionNav: false,
            controlNav: true,
            touch: true,
            pauseOnHover: true,
            start: function() {
                $.waypoints('refresh');
            }
        });
    }

    // 检查 #teamSlider 是否存在
    if ($('#teamSlider').length) {
        $('#teamSlider').flexslider({
            animation: "slide",
            directionNav: false,
            controlNav: true,
            touch: true,
            pauseOnHover: true,
            start: function() {
                $.waypoints('refresh');
            }
        });
    }

    // 检查 #clientSlider 是否存在
    if ($('#clientSlider').length) {
        $('#clientSlider').flexslider({
            animation: "slide",
            directionNav: false,
            controlNav: true,
            touch: true,
            pauseOnHover: true,
            start: function() {
                $.waypoints('refresh');
            }
        });
    }
});
