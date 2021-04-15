function main() {
    let xLabels = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
    let svg = d3.select('#strip-rating-count'),
        margin = {top: 60, bottom: 60, left: 80, right: 200},
        width = svg.attr('width') - margin.left - margin.right,
        height = svg.attr('height') - margin.top - margin.bottom

    let xScale = d3.scaleBand().range([margin.left, margin.left + width]).domain(xLabels).padding(0.2),
        yScale = d3.scaleLog().range([height + margin.top, margin.top])

    d3.csv('appstore_games.csv', d => {
        return {
            rating: +d['Average User Rating'],
            count: +d['User Rating Count'],
        }
    }).then(dataset => {
        let data = []
        dataset.forEach(elem => {
            if (elem.rating > 0 && elem.count >= 10) {
                data.push({rating: elem.rating, count: elem.count})
            }
        })
        console.log(data)

        yScale.domain([d3.min(data, d => d.count), d3.max(data, d => d.count)])

        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.rating) + xScale.bandwidth() * Math.random())
            .attr('cy', d => yScale(d.count))
            .attr('r', 2)
            .attr('fill', d3.rgb(40, 88, 233, 0.3))

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
            .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.2s')))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', - height / 2 - margin.top)
            .attr('y', - margin.left / 2)
            .text('User Rating Count')
    })
}

main()
