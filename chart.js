'use strict';

// // Chart function
// function runChart() {

//     var ctx = document.getElementById('itemChart').getContext('2d');

//     // eslint-disable-next-line no-unused-vars
//     var itemChart = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: getItemArray('stateName'),
//             datasets: [{
//                 label: '# of Votes',
//                 data: getItemArray('positive'),
//                 backgroundColor: [
//                     'rgba(255, 99, 132, 0.8)',
//                     'rgba(54, 162, 235, 0.8)',
//                     'rgba(255, 206, 86, 0.8)',
//                     'rgba(75, 192, 192, 0.8)',
//                     'rgba(153, 102, 255, 0.8)',
//                     'rgba(255, 159, 64, 0.8)',
//                     'rgba(255, 99, 132, 0.8)',
//                     'rgba(54, 162, 235, 0.8)',
//                     'rgba(255, 206, 86, 0.8)',
//                     'rgba(75, 192, 192, 0.8)',
//                     'rgba(153, 102, 255, 0.8)',
//                     'rgba(255, 159, 64, 0.8)',
//                     'rgba(255, 99, 132, 0.8)',
//                     'rgba(54, 162, 235, 0.8)',
//                     'rgba(255, 206, 86, 0.8)',
//                     'rgba(75, 192, 192, 0.8)',
//                     'rgba(153, 102, 255, 0.8)',
//                     'rgba(255, 159, 64, 0.8)',
//                     'rgba(255, 99, 132, 0.8)',
//                     'rgba(54, 162, 235, 0.8)',
//                     'rgba(255, 206, 86, 0.8)',
//                     'rgba(75, 192, 192, 0.8)',
//                     'rgba(153, 102, 255, 0.8)',
//                     'rgba(255, 159, 64, 0.8)'
//                 ],
//                 borderColor: [
//                     'rgba(255, 99, 132, 1)',
//                     'rgba(54, 162, 235, 1)',
//                     'rgba(255, 206, 86, 1)',
//                     'rgba(75, 192, 192, 1)',
//                     'rgba(153, 102, 255, 1)',
//                     'rgba(255, 159, 64, 1)',
//                     'rgba(255, 99, 132, 1)',
//                     'rgba(54, 162, 235, 1)',
//                     'rgba(255, 206, 86, 1)',
//                     'rgba(75, 192, 192, 1)',
//                     'rgba(153, 102, 255, 1)',
//                     'rgba(255, 159, 64, 1)',
//                     'rgba(255, 99, 132, 1)',
//                     'rgba(54, 162, 235, 1)',
//                     'rgba(255, 206, 86, 1)',
//                     'rgba(75, 192, 192, 1)',
//                     'rgba(153, 102, 255, 1)',
//                     'rgba(255, 159, 64, 1)',
//                     'rgba(255, 99, 132, 1)',
//                     'rgba(54, 162, 235, 1)',
//                     'rgba(255, 206, 86, 1)',
//                     'rgba(75, 192, 192, 1)',
//                     'rgba(153, 102, 255, 1)',
//                     'rgba(255, 159, 64, 1)'
//                 ],
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             scales: {
//                 yAxes: [{
//                     ticks: {
//                         beginAtZero: true
//                     }
//                 }]
//             }
//         }
//     });
// }
