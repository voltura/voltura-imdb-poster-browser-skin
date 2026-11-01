export const titles = [
  {id:'tt1000001', title:'Alpha', year:2020, rating:9.1, score:0, type:'movie'},
  {id:'tt1000002', title:'Bravo', year:2010, rating:8.2, score:95, type:'movie'},
  {id:'tt1000003', title:'Charlie', year:2024, rating:7.3, score:60, type:'tvMovie'},
  {id:'tt1000004', title:'Delta', year:2018, rating:6.4, score:null, type:'movie'},
  {id:'tt1000005', title:'Echo', year:2022, rating:5.5, score:45, type:'tvSeries'},
  {id:'tt1000006', title:'Foxtrot', year:2014, rating:4.6, score:null, type:'movie'},
  {id:'tt1000007', title:'Golf', year:2025, rating:3.7, score:null, type:'movie'}
];
export function credit(t, role = 'Lead') {
  return {node:{title:{id:t.id, titleText:{text:t.title}, releaseYear:{year:t.year},
    titleType:{id:t.type, text:t.type === 'movie' ? 'Movie' : 'Television'},
    ratingsSummary:{aggregateRating:t.rating}, primaryImage:{url:'https://m.media-amazon.com/images/' + t.id + '.jpg'}},
    creditedRoles:{edges:[{node:{text:role}}]}}};
}
export function fixtureHtml() {
  const props = {pageProps:{aboveTheFold:{nameText:{text:'Fixture Person'}}, mainColumnData:{released:{edges:[
    {node:{grouping:{groupingId:'actor'},credits:{edges:titles.map(t => credit(t))}}},
    {node:{grouping:{groupingId:'writer'},credits:{edges:[credit(titles[0],'Screenplay')]}}},
    {node:{grouping:{groupingId:'producer'},credits:{edges:[credit(titles[1],'Executive producer')]}}},
    {node:{grouping:{groupingId:'director'},credits:{edges:[credit(titles[2],'Director')]}}}
  ]}}}};
  return `<!doctype html><html><head><title>Fixture Person - IMDb test fixture</title></head><body style="background:#17171b;color:white;font:18px system-ui;min-height:1800px"><h1>Fixture Person</h1>
    <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({props})}</script>
    <div class="ipc-accordion__item__content_inner"><ul><li data-testid="cred_actor_tt1000001"><a class="ipc-metadata-list-summary-item__t" href="/title/tt1000001/">Alpha</a><span class="ipc-metadata-list-summary-item__li">2020</span></li></ul>
    <button id="more">See all</button></div>
    <script>document.getElementById('more').addEventListener('click', function() {this.previousElementSibling.insertAdjacentHTML('beforeend','<li data-testid="cred_director_tt1000008"><a class="ipc-metadata-list-summary-item__t" href="/title/tt1000008/">Hotel</a><span class="ipc-metadata-list-summary-item__li">2000</span><span data-testid="credit-roles-list">Director</span></li>');this.remove();});</script>
    <a class="ipc-poster" href="/title/tt1000001/">Outside credit section</a></body></html>`;
}
export function ratingHtml(t) {
  const row = (year = t.year) => `<search-page-media-row release-year="${year}" start-year="${year}" ${t.score == null ? '' : `tomatometer-score="${t.score}"`}><a slot="title" href="https://www.rottentomatoes.com/${t.type === 'tvSeries' ? 'tv' : 'm'}/${t.title.toLowerCase()}">${t.title}</a></search-page-media-row>`;
  if (t.title === 'Foxtrot') return row(t.year - 1);
  if (t.title === 'Golf') return row() + row();
  return row();
}
