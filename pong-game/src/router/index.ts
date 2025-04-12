const routes: Record<string, string> = {
	'/': 'WelcomePage',
	'/login': 'LoginPage',
	'/signup': 'RegisterPage',
	'/main': 'MainPage',
	'/rank': 'RankPage',
	'/history': 'HistoryPage',
	'/profile': 'ProfilePage',
	'/friends': 'FriendsPage',
	'/local': 'LocalGamePage',
	'/tournament': 'TournamentPage',
	'/tournament_setup': 'TournamentSetupPage'
  }  
  
  export function initRouter() {
	window.addEventListener('hashchange', renderPage);
	renderPage();
  }
  
  function renderPage() {
	const hash = window.location.hash || '#/';
	const pageId = hash.replace('#', '');
	const page = routes[pageId] || 'WelcomePage';
	import(`../pages/${page}.ts`).then((mod) => {
	  mod.render();
	});
  }
  