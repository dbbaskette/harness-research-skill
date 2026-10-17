# Announcing Redis 8.6: Performance improvements, streams enhancements, new eviction policies, & more

February 10, 2026 14 minute read

Image: Lior Kogan 
Lior Kogan

Summarize with AI
  *   *   * Redis 8.6 in Redis Open Source is now available. This release delivers performance and resource utilization improvements, plus a set of community-requested updates that make day-to-day development and operations smoother. It includes new Streams safeguards, more eviction control, better hotkey visibility, simpler TLS auth, and more flexible time series handling.
  * Performance and resource utilization improvements in Redis 8.6   * New features explained:
    * Streams: At-most-once production guarantee     * Eviction: Least recently modified policies     * Hotkeys: Detection and reporting     * Security: TLS certificate-based automatic client authentication     * Time series: Support for NaN values With Redis 8.6 in Redis Open Source, we continue to deliver on our commitment to continuous performance improvement. The chart below shows our steady throughput increase (operations per second) for a typical caching workload use case across successive releases of Redis.
### Redis 8.6 in Redis Open Source: More than 5x throughput compared to Redis 7.2

Image: Redis 
Single node; using only 16 cores on an m8g.24xlarge instance (ARM, Graviton4); 11 io-threads; Pipeline size: 1; 2000 clients Caching use case: 1:10 SET : GET ratio; 1M keys; 1K string values

With pipeline size set to 16, Redis 8.6 reaches 3.5M ops/sec.
Redis performance improvements are not limited to better multithreading. We continuously reduce the latency of many commands. Compared to Redis 8.4, in Redis 8.6, we achieved:

  * Up to 35% lower latency for sorted set commands
  * Up to 15% lower latency for GET command on short strings
  * Up to 11% lower latency on list commands
  * Up to 7% lower latency on hash commands
### Redis 8.6 max latency improvement compared to Redis 8.4 (single core)

Image: Redis 
Single node; using a single thread on a m8g.24xlarge instance (ARM, Graviton4)

The throughput and latency improvements are similar on Intel and AMD processors.

In addition, in 8.6 we achieved a tremendous reduction in the memory footprint of hashes and sorted sets - up to 16.7% and 30.5% respectively.
### Redis 8.6 max memory reduction by data type compared to Redis 8.4

Image: Redis 
Compared to Redis 8.4, in Redis 8.6, we improve vector sets vector insertion performance by up to 43% and querying performance by up to 58%.

### VADD improvements on binary and 8-bit quantization for x86-64 architecture

Image: Redis 
Single node; m8i.24xlarge machine (Intel)

