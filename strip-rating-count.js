function main() {
    let xLabels = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
    let svg = d3.select('#strip-rating-count'),
        margin = {top: 60, bottom: 60, left: 80, right: 160},
        width = svg.attr('width') - margin.left - margin.right,
        height = svg.attr('height') - margin.top - margin.bottom

    let tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)

    let xScale = d3.scaleBand().range([margin.left, margin.left + width]).domain(xLabels).padding(0.2),
        yScale = d3.scaleLog().range([height + margin.top, margin.top]),
        zScale = d3.scaleOrdinal([
            d3.schemeTableau10[4],
            d3.schemeTableau10[0],
            d3.schemeTableau10[5],
            d3.schemeTableau10[2]
        ]).domain([0, 1, 2, 3])

    d3.csv('appstore_games.csv', d => {
        return {
            name: d['Name'],
            rating: +d['Average User Rating'],
            count: +d['User Rating Count'],
            free: +d['Price'] === 0,
            iap: d['In-app Purchases'] !== ''
        }
    }).then(dataset => {
        let data = []
        dataset.forEach(elem => {
            if (elem.rating > 0 && elem.count >= 100) {
                data.push({
                    name: elem.name,
                    rating: elem.rating,
                    count: elem.count,
                    free: elem.free,
                    iap: elem.iap,
                    category: (elem.free ? 0 : 2) + (elem.iap ? 1 : 0)})
            }
        })
        console.log(data)

        yScale.domain([d3.min(data, d => d.count), d3.max(data, d => d.count)])

        function hover(event, d) {
            d3.select(this).transition().duration(300).style('stroke', 'black')
            tooltip.transition().duration(200).style('opacity', 0.9)
            tooltip.html(
                'Name: ' + d.name
                + '<br>Average Rating: ' + d.rating
                + '<br>Rating Count: ' + d.count
                + '<br>Charge Category: ' + (d.free ? 'Free' : 'Paid') + ', IAP' + (d.iap ? '' : '-Free')
            )
                .style('left', (event.pageX + 20) + 'px')
                .style('top', (event.pageY + 5) + 'px')
        }

        function exit() {
            d3.select(this).transition().duration(300).style('stroke', 'transparent')
            tooltip.transition().duration(600).style('opacity', 0)
        }

        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', d => 'c' + d.category)
            .attr('cx', d => xScale(d.rating) + xScale.bandwidth() * (d.category + Math.random()) / 4)
            .attr('cy', d => yScale(d.count))
            .attr('r', 2.2)
            .attr('fill', d => zScale(d.category))
            .attr('opacity', 0.5)
            .on('mouseover', hover)
            .on('mouseout', exit)

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0, ' + (height + margin.top) + ')')
            .call(d3.axisBottom(xScale).tickValues(xLabels))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2 + margin.left)
            .attr('y', margin.bottom / 2)
            .text('Average User Rating')

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + margin.left + ', 0)')
            .call(d3.axisLeft(yScale).ticks(4).tickFormat(d3.format('.2s')))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', - height / 2 - margin.top)
            .attr('y', - margin.left / 2)
            .text('User Rating Count')

        let legend = d3.legendColor()
            .title('Color Legend')
            .labels(['Totally Free', 'Free but IAP', 'IAPFree but Paid', 'Paid & IAP'])
            .scale(zScale)

        svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + (width + margin.left + margin.right/5) + ',' + ((height - margin.bottom) / 2) + ')')
            .call(legend)

        svg.selectAll('g.cell')
            .on('mouseover', (event, i, d) => {
                let cs = svg.selectAll('circle.c' + i)
                svg.selectAll('circle').style('fill', 'lightgrey')
                cs.style('fill', zScale(i)).style('stroke', zScale(i))
            })
            .on('mouseout', (event, i, d) => {
                svg.selectAll('circle').style('fill', d => zScale(d.category)).style('stroke', 'transparent')
            })
    })
}

main()
