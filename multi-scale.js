function main() {
    let svg = d3.select('#multi-scale'),
        margin = {top: 60, bottom: 60, left: 80, right: 200},
        width = svg.attr('width') - margin.left - margin.right,
        height = svg.attr('height') - margin.top - margin.bottom

    let tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)

    let names = [
        'Clash of Clans', 'Clash Royale', 'PUBG MOBILE', 'Plague Inc.',
        'Sudoku (Free)', 'Traffic Rush'
    ]

    d3.csv('appstore_games.csv', d => {
        return {
            name: d['Name'],
            rating: +d['Average User Rating'],
            count: +d['User Rating Count'],
            price: +d['Price'],
            iap: d['In-app Purchases'] !== '',
            developer: d['Developer'],
            age: d['Age Rating'],
            language: d['Languages'],
            size: +d['Size'],
            genres: d['Genres']
        }
    }).then(dataset => {
        let data = dataset.filter(d => names.includes(d.name))
        // data.forEach(d => d.genres = d.genres.filter(g => g !== 'Games' && g !== 'Strategy'))
        console.log(data)

        let ratingR = d3.scaleLinear().range([1, 24])
                .domain([1, 5]),
            countY = d3.scaleLinear().range([height + margin.top, margin.top])
                .domain([0, d3.max(data, d => d.count)]),
            freeColor = d3.scaleOrdinal([
                d3.schemeTableau10[4],
                d3.schemeTableau10[0],
                d3.schemeTableau10[5],
                d3.schemeTableau10[2]
            ]).domain([0, 1, 2, 3]),
            ageStroke = d3.scaleOrdinal([
                d3.schemeDark2[0],
                d3.schemeDark2[4],
                d3.schemeDark2[5],
                d3.schemeDark2[6]
            ]).domain(['4+', '9+', '12+', '17+']),
            sizeX = d3.scaleLog().range([margin.left, margin.left + width])
                .domain([1e6, d3.max(data, d => d.size) * 1.5])

        function hover(event, d) {
            tooltip.transition().duration(200).style('opacity', 0.9)
            tooltip.html(
                'Name: ' + d.name
                + '<br>Average Rating: ' + d.rating
                + '<br>Rating Count: ' + d.count
                + '<br>Price: ' + d.price
                + '<br>In-app Purchases: IAP' + (d.iap ? '' : 'Free')
                + '<br>Developer: ' + d.developer
                + '<br>Age Rating: ' + d.age
                + '<br>Language: ' + d.language
                + '<br>Size: ' + d.size
                + '<br>Genres: ' + d.genres
            )
                .style('left', (event.pageX + 20) + 'px')
                .style('top', (event.pageY + 5) + 'px')
        }

        function exit() {
            tooltip.transition().duration(600).style('opacity', 0)
        }

        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => sizeX(d.size))
            .attr('cy', d => countY(d.count))
            .attr('r', d => ratingR(d.rating))
            .attr('fill', d => freeColor((d.price === 0 ? 0 : 2) + (d.iap ? 1 : 0)))
            .attr('stroke', d => ageStroke(d.age))
            .attr('stroke-width', 5)
            .on('mouseover', hover)
            .on('mouseout', exit)

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0, ' + (height + margin.top) + ')')
            .call(d3.axisBottom(sizeX).ticks(3).tickFormat(d3.format('.2s')))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2 + margin.left)
            .attr('y', margin.bottom / 2)
            .text('Game Size')

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + margin.left + ', 0)')
            .call(d3.axisLeft(countY).ticks(4).tickFormat(d3.format('.2s')))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', - height / 2 - margin.top)
            .attr('y', - margin.left / 2)
            .text('User Rating Count')

        let legendColor = d3.legendColor()
            .title('Color Legend')
            .labels(['Totally Free', 'Free but IAP', 'IAPFree but Paid', 'Paid & IAP'])
            .scale(freeColor)

        svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (width + margin.left + margin.right/5) + ',' + ((height - margin.bottom) / 7) + ')')
            .call(legendColor)

        let legendStroke = d3.legendColor()
            .title('Stroke Legend - Age')
            .scale(ageStroke)

        svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (width + margin.left + margin.right/5) + ',' + ((height - margin.bottom) / 2) + ')')
            .call(legendStroke)

        let legendSize = d3.legendSize()
            .scale(ratingR)
            .shape('circle')
            .title('Size Legend - Rating')
            .shapePadding(10)
            .labelOffset(20)

        svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (width + margin.left + margin.right/5) + ',' + ((height - margin.bottom * 1.5)) + ')')
            .call(legendSize)
    })
}

main()
