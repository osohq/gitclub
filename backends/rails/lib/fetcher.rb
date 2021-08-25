module Fetcher
  def self.included(base)
    base.class_eval do
      qhash = lambda do |c|
        if c.field.nil?
          { primary_key => c.value.send(primary_key) }
        else
          { c.field => c.value }
        end
      end

      kinds = Hash.new { |k| raise "Unsupported constraint kind: #{k}" }
      kinds['Eq'] = kinds['In'] = ->(q, c) { q.where(qhash[c]) }
      kinds['Neq'] = ->(q, c) { q.where.not(qhash[c]) }

      const_set(:FETCHER, lambda do |cons|
        cons.reduce(all) { |q, con| kinds[con.kind][q, con] }
      end)
    end
  end
end
